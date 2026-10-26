import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { runSeed } from '../src/seed/seed';
import { Express } from 'express';

let app: Express;
let patientToken: string;
let doctorToken: string;
let hospitalAdminToken: string;
let labAdminToken: string;
let pharmacyToken: string;
let patientUserId: string;
let doctorProfileId: string;
let hospitalOrgId: string;

beforeAll(async () => {
  await runSeed();
  app = createApp() as Express;

  // Login as Patient
  const patientRes = await request(app).post('/api/v1/auth/login').send({
    email: 'patient@swasthya.demo',
    password: 'Password123!',
  });
  expect(patientRes.status).toBe(200);
  patientToken = patientRes.body.accessToken;
  patientUserId = patientRes.body.user.id;

  // Login as Hospital Doctor
  const docRes = await request(app).post('/api/v1/auth/login').send({
    email: 'doctor.sharma@swasthya.demo',
    password: 'Password123!',
  });
  expect(docRes.status).toBe(200);
  doctorToken = docRes.body.accessToken;

  // Login as Hospital Admin
  const adminRes = await request(app).post('/api/v1/auth/login').send({
    email: 'hospital.admin@swasthya.demo',
    password: 'Password123!',
  });
  expect(adminRes.status).toBe(200);
  hospitalAdminToken = adminRes.body.accessToken;

  // Login as Lab Admin
  const labRes = await request(app).post('/api/v1/auth/login').send({
    email: 'lab.admin@swasthya.demo',
    password: 'Password123!',
  });
  expect(labRes.status).toBe(200);
  labAdminToken = labRes.body.accessToken;

  // Login as Pharmacy Owner
  const pharmRes = await request(app).post('/api/v1/auth/login').send({
    email: 'pharmacy.owner@swasthya.demo',
    password: 'Password123!',
  });
  expect(pharmRes.status).toBe(200);
  pharmacyToken = pharmRes.body.accessToken;

  // Fetch Doctor profile and Hospital ID
  const docsRes = await request(app).get('/api/v1/doctors');
  expect(docsRes.status).toBe(200);
  doctorProfileId = docsRes.body.data[0]._id;
  hospitalOrgId = docsRes.body.data[0].organizationId._id;
});

afterAll(async () => {
  await disconnectDB();
});

describe('1. Authentication & RBAC', () => {
  it('rejects login with invalid password without exposing email existence', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'patient@swasthya.demo',
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows access to protected /me endpoint with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('patient@swasthya.demo');
    expect(res.body.user.role).toBe('patient');
  });

  it('denies patient access to admin-only verification queue', async () => {
    const res = await request(app)
      .get('/api/v1/verification/queue')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('2. Healthcare Directory & Bed Freshness', () => {
  it('returns hospital listings with bed summary', async () => {
    const res = await request(app).get('/api/v1/organizations?type=hospital');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const sgm = res.body.data[0];
    expect(sgm.bedSummary).toBeDefined();
    expect(sgm.bedSummary.totalCapacity).toBeGreaterThan(0);
  });

  it('returns bed inventory with freshness flags and timestamps', async () => {
    const res = await request(app).get('/api/v1/beds');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const bed = res.body.data[0];
    expect(bed.lastUpdatedAt).toBeDefined();
    expect(bed.isStale).toBeDefined();
  });
});

describe('3. Appointment Booking & Double-Booking Prevention', () => {
  const testDate = '2026-11-15';
  const testSlot = '10:00 AM';

  it('successfully books a free slot for a doctor', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        appointmentDate: testDate,
        timeSlot: testSlot,
        reason: 'General checkup',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.timeSlot).toBe(testSlot);
  });

  it('prevents double-booking for the same doctor, date and time slot', async () => {
    const conflictRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorProfileId,
        appointmentDate: testDate,
        timeSlot: testSlot,
        reason: 'Another patient trying to take the exact same slot',
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.success).toBe(false);
    expect(conflictRes.body.error).toContain('Slot Conflict');
  });
});

describe('4. Bed Inventory Updates & Capacity Validation', () => {
  it('rejects bed update if sum of states exceeds total capacity', async () => {
    const bedsRes = await request(app).get('/api/v1/beds');
    const bedId = bedsRes.body.data[0]._id;

    const invalidRes = await request(app)
      .put(`/api/v1/beds/${bedId}`)
      .set('Authorization', `Bearer ${hospitalAdminToken}`)
      .send({
        totalCapacity: 20,
        available: 15,
        occupied: 10, // 15 + 10 = 25 > 20
        cleaning: 2,
        reserved: 0,
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error).toContain('Capacity Inconsistency');
  });

  it('updates bed counts and records updater timestamp', async () => {
    const bedsRes = await request(app).get('/api/v1/beds');
    const bedId = bedsRes.body.data[0]._id;

    const validRes = await request(app)
      .put(`/api/v1/beds/${bedId}`)
      .set('Authorization', `Bearer ${hospitalAdminToken}`)
      .send({
        totalCapacity: 24,
        available: 8,
        occupied: 14,
        cleaning: 2,
        reserved: 0,
        notes: 'Updated during evening clinical handover',
      });

    expect(validRes.status).toBe(200);
    expect(validRes.body.data.available).toBe(8);
  });
});

describe('5. Diagnostic Lab Release Security Gating', () => {
  it('masks unreleased lab results from patient view', async () => {
    const res = await request(app)
      .get('/api/v1/lab-orders')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    const unreleased = res.body.data.find((o: any) => o.isReleasedToPatient === false);
    if (unreleased) {
      expect(unreleased.results.length).toBe(0);
      expect(unreleased.reportStatusNotice).toBeDefined();
    }
  });

  it('denies patient direct access to unreleased lab report detail', async () => {
    // Find unreleased order ID as lab admin
    const labOrdersRes = await request(app)
      .get('/api/v1/lab-orders')
      .set('Authorization', `Bearer ${labAdminToken}`);

    const unreleasedOrder = labOrdersRes.body.data.find((o: any) => o.isReleasedToPatient === false);

    if (unreleasedOrder) {
      const patientDetailRes = await request(app)
        .get(`/api/v1/lab-orders/${unreleasedOrder._id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(patientDetailRes.status).toBe(403);
      expect(patientDetailRes.body.error).toContain('withheld');
    }
  });
});

describe('6. AI Medical Safeguards & Red-Flag Interception', () => {
  it('detects acute cardiac red-flag and triggers immediate emergency redirect', async () => {
    const res = await request(app).post('/api/v1/ai/triage').send({
      symptoms: 'Patient having crushing severe chest pain and left arm pain for 30 minutes',
      language: 'en',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.isEmergency).toBe(true);
    expect(res.body.data.advice).toContain('RED FLAG DETECTED');
    expect(res.body.data.advice).toContain('112 / 108');
  });

  it('provides non-emergency guidance for common symptoms with disclaimer', async () => {
    const res = await request(app).post('/api/v1/ai/triage').send({
      symptoms: 'Mild cold and dry cough since yesterday',
      language: 'en',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.isEmergency).toBe(false);
    expect(res.body.data.disclaimer).toContain('Not a medical diagnosis');
  });
});
