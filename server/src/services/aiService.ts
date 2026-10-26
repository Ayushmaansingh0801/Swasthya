import { env } from '../config/env';

export interface SymptomAssessmentResult {
  isEmergency: boolean;
  emergencyType?: string;
  advice: string;
  adviceHindi: string;
  recommendedDepartment?: string;
  disclaimer: string;
}

export interface ReportAnalysisResult {
  summary: string;
  summaryHindi: string;
  keyFindings: Array<{
    parameter: string;
    value: string;
    status: 'normal' | 'high' | 'low' | 'attention';
    explanation: string;
    explanationHindi: string;
  }>;
  suggestedQuestionsForDoctor: string[];
  disclaimer: string;
  isMock: boolean;
}

const RED_FLAGS = [
  { trigger: ['chest pain', 'heart attack', 'cleft chest', 'crushing pain', 'left arm pain'], type: 'Cardiac Emergency / दिल का दौरा' },
  { trigger: ['cannot breathe', 'difficulty breathing', 'severe breathlessness', 'suffocating', 'gasping'], type: 'Respiratory Failure / सांस लेने में गंभीर तकलीफ' },
  { trigger: ['unconscious', 'passed out', 'fainted and not waking', 'loss of consciousness'], type: 'Altered Sensorium / बेहोशी' },
  { trigger: ['stroke', 'face drooping', 'arm weakness', 'speech slurred', 'paralysis'], type: 'Cerebrovascular Stroke / लकवा / स्ट्रोक' },
  { trigger: ['heavy bleeding', 'severe blood loss', 'vomiting blood', 'coughing blood'], type: 'Hemorrhage / अत्यधिक रक्तस्राव' },
  { trigger: ['severe head injury', 'skull trauma', 'head trauma convulsion'], type: 'Head Injury / गंभीर सिर की चोट' },
  { trigger: ['poison', 'swallowed chemical', 'snake bite'], type: 'Toxic Ingestion / विषपान / सर्पदंश' },
];

export class AIService {
  public static checkEmergencyRedFlags(text: string): SymptomAssessmentResult | null {
    const lower = text.toLowerCase();
    for (const flag of RED_FLAGS) {
      if (flag.trigger.some((word) => lower.includes(word))) {
        return {
          isEmergency: true,
          emergencyType: flag.type,
          advice: `RED FLAG DETECTED: Symptoms describe a potential medical emergency (${flag.type}). DO NOT DELAY. Call National Emergency Helpline 112 / 108 or go immediately to the nearest Hospital Emergency Room / Trauma Center.`,
          adviceHindi: `आपातकालीन चेतावनी: आपके लक्षण चिकित्सीय आपात स्थिति (${flag.type}) की ओर संकेत कर रहे हैं। बिना देर किए तुरंत 112 / 108 पर संपर्क करें या नजदीकी अस्पताल के इमरजेंसी/ट्रॉमा वार्ड में जाएं।`,
          recommendedDepartment: 'Emergency / Trauma / ICU',
          disclaimer: 'Swasthya AI is not an emergency dispatch system or medical replacement. In emergencies, call 112 / 108 immediately.',
        };
      }
    }
    return null;
  }

  public static async analyzeSymptoms(symptoms: string, language: 'en' | 'hi' = 'en'): Promise<SymptomAssessmentResult> {
    // First, check red flags
    const redFlag = this.checkEmergencyRedFlags(symptoms);
    if (redFlag) {
      return redFlag;
    }

    // Normal symptom guidance
    const lower = symptoms.toLowerCase();
    let department = 'General Medicine';
    let enAdvice = 'These symptoms should be evaluated by a healthcare professional. Ensure rest, hydration, and note any changes in temperature or intensity.';
    let hiAdvice = 'इन लक्षणों की डॉक्टर द्वारा जांच करानी चाहिए। पर्याप्त आराम करें, पानी पिएं और तापमान में किसी भी बदलाव पर ध्यान रखें।';

    if (lower.includes('fever') || lower.includes('bukhar') || lower.includes('temperature') || lower.includes('chills')) {
      department = 'General Medicine / Internal Medicine';
      enAdvice = 'Fever could indicate a viral or bacterial infection (such as flu, malaria, typhoid, or dengue). Monitor body temperature regularly, stay hydrated, and visit an OPD doctor if it persists beyond 48 hours.';
      hiAdvice = 'बुखार वायरल या बैक्टीरियल संक्रमण (जैसे फ्लू, मलेरिया, टाइफाइड या डेंगू) का संकेत हो सकता है। नियमित रूप से तापमान मापें, ओआरएस या पानी पिएं, और यदि यह 48 घंटे से अधिक रहे तो डॉक्टर को दिखाएं।';
    } else if (lower.includes('cough') || lower.includes('cold') || lower.includes('throat') || lower.includes('khansi')) {
      department = 'Pulmonology / ENT / General Medicine';
      enAdvice = 'Upper respiratory symptoms like cough and sore throat are commonly caused by viral pharyngitis or allergies. Warm salt water gargles and steam inhalation may provide symptomatic relief.';
      hiAdvice = 'खांसी और गले में खराश अक्सर वायरल संक्रमण या एलर्जी के कारण होती है। गुनगुने नमक के पानी से गरारे करें और भाप लें। यदि सांस लेने में कठिनाई हो तो तुरंत डॉक्टर से मिलें।';
    } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('itch') || lower.includes('khujli')) {
      department = 'Dermatology';
      enAdvice = 'Rashes or itching can be triggered by contact allergens, fungal infections, or eczema. Avoid scratching and keep the area dry until a dermatologist examines the lesions.';
      hiAdvice = 'त्वचा पर चकत्ते या खुजली एलर्जी या फंगल इन्फेक्शन के कारण हो सकती है। खुजलाने से बचें और त्वचा रोग विशेषज्ञ को दिखाएं।';
    } else if (lower.includes('joint') || lower.includes('bone') || lower.includes('knee') || lower.includes('dard') || lower.includes('back')) {
      department = 'Orthopedics / Physiotherapy';
      enAdvice = 'Joint or musculoskeletal discomfort might stem from strain, osteoarthritis, or posture issues. Gentle mobilization and hot/cold fomentation may help.';
      hiAdvice = 'जोड़ों या कमर का दर्द खिंचाव या गठिया के कारण हो सकता है। अधिक वजन उठाने से बचें और ऑर्थोपेडिक विशेषज्ञ से परामर्श लें।';
    }

    return {
      isEmergency: false,
      advice: enAdvice,
      adviceHindi: hiAdvice,
      recommendedDepartment: department,
      disclaimer: 'Informational guidance only. Not a medical diagnosis or treatment prescription. Always consult an authorized clinician.',
    };
  }

  public static async explainLabReport(reportText: string, parameters: Array<{ name: string; value: string; unit?: string }>): Promise<ReportAnalysisResult> {
    const keyFindings = parameters.map((param) => {
      const lower = param.name.toLowerCase();
      let status: 'normal' | 'high' | 'low' | 'attention' = 'normal';
      let explanation = `${param.name} is measured at ${param.value}. Within typical clinical limits.`;
      let explanationHindi = `${param.name} का स्तर ${param.value} है, जो सामान्य सीमा के भीतर प्रतीत होता है।`;

      const numVal = parseFloat(param.value);

      if (lower.includes('hemoglobin') || lower.includes('hb')) {
        if (!isNaN(numVal) && numVal < 12) {
          status = 'low';
          explanation = `Hemoglobin (${param.value}) is on the lower side, which may indicate mild anemia or iron deficiency.`;
          explanationHindi = `हीमोग्लोबिन (${param.value}) कम है, जो एनीमिया या आयरन की कमी का संकेत हो सकता है।`;
        } else if (!isNaN(numVal) && numVal > 17) {
          status = 'high';
          explanation = `Hemoglobin (${param.value}) is elevated. Needs clinician evaluation for dehydration or erythrocytosis.`;
          explanationHindi = `हीमोग्लोबिन (${param.value}) सामान्य से अधिक है। निर्जलीकरण या अन्य कारणों की जांच आवश्यक है।`;
        }
      } else if (lower.includes('platelet')) {
        if (!isNaN(numVal) && numVal < 150000) {
          status = 'low';
          explanation = `Platelet count (${param.value}) is below standard range. Clinician review is recommended to rule out infections like dengue or viral fevers.`;
          explanationHindi = `प्लेटलेट काउंट (${param.value}) सामान्य से कम है। डेंगू या वायरल संक्रमण की जांच के लिए डॉक्टर से संपर्क करें।`;
        }
      } else if (lower.includes('sugar') || lower.includes('glucose') || lower.includes('fasting')) {
        if (!isNaN(numVal) && numVal > 125) {
          status = 'high';
          explanation = `Blood Glucose (${param.value}) is elevated above typical fasting levels (>125 mg/dL), indicating possible diabetes or pre-diabetes.`;
          explanationHindi = `ब्लड शुगर (${param.value}) सामान्य से अधिक है, जो डायबिटीज की संभावना दर्शाता है। डॉक्टर से जांच कराएं।`;
        }
      } else if (lower.includes('creatinine')) {
        if (!isNaN(numVal) && numVal > 1.3) {
          status = 'high';
          explanation = `Serum Creatinine (${param.value}) is elevated, which can indicate stress on kidney filtration.`;
          explanationHindi = `सीरम क्रिएटिनिन (${param.value}) बढ़ा हुआ है, जो किडनी के कार्य पर तनाव का संकेत दे सकता है।`;
        }
      }

      return {
        parameter: param.name,
        value: param.value + (param.unit ? ` ${param.unit}` : ''),
        status,
        explanation,
        explanationHindi,
      };
    });

    const hasAbnormal = keyFindings.some((k) => k.status !== 'normal');

    return {
      summary: hasAbnormal
        ? 'Some test parameters deviate from the standard laboratory reference intervals. Please review with your doctor for clinical interpretation.'
        : 'All measured parameters in this report appear to fall within standard reference intervals.',
      summaryHindi: hasAbnormal
        ? 'इस रिपोर्ट के कुछ पैरामीटर सामान्य संदर्भ सीमा से भिन्न हैं। सटीक व्याख्या और उपचार के लिए कृपया अपने डॉक्टर को दिखाएं।'
        : 'इस रिपोर्ट के सभी मापदंड सामान्य सीमा के भीतर प्रतीत होते हैं।',
      keyFindings,
      suggestedQuestionsForDoctor: [
        'Do I need any dietary modifications based on these values?',
        'Should any of these tests be repeated after a few weeks?',
        'Are these test results influenced by any medication I currently take?',
      ],
      disclaimer: 'AI report analysis is informational and educational only. Never make medication or treatment adjustments without a licensed physician.',
      isMock: env.AI_PROVIDER === 'mock',
    };
  }

  public static generateClinicalDraftSummary(clinicalNotes: {
    symptoms?: string;
    examination?: string;
    diagnosis?: string;
    plan?: string;
  }): string {
    return `[AI-GENERATED DRAFT SUMMARY - FOR CLINICIAN REVIEW ONLY]
Patient presented with complaints of: ${clinicalNotes.symptoms || 'None recorded'}.
Key examination findings: ${clinicalNotes.examination || 'Unremarkable'}.
Working clinical assessment: ${clinicalNotes.diagnosis || 'Under evaluation'}.
Outlined management plan: ${clinicalNotes.plan || 'Routine care and monitoring'}.
*Draft prepared for clinician signature. Not an autonomous medical decision.*`;
  }
}
