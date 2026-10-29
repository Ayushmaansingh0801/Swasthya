import pypdf, os

f = 'c:/Users/ayush/Downloads/Antigravity_Cline_Cloud_Deployment_Master_Prompt.pdf'
r = pypdf.PdfReader(f)
out = []
for i, p in enumerate(r.pages):
    out.append('--- page %d ---\n' % (i + 1))
    out.append(p.extract_text() or '')
open('d:/Swasthya/deploy_prompt.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('done', os.path.getsize('d:/Swasthya/deploy_prompt.txt'), 'pages', len(r.pages))
