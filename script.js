const SYSTEM_PROMPT = `你是专业互联网简历优化师，擅长根据JD优化简历。规则：1.保留真实经历，只优化表达；2.语言干练、结果导向；3.匹配JD关键词；4.输出格式清晰。`;

let fileContent = "";
let originalFile = null;

function extractKeywords(text) {
  const patterns = [
    /版本发布|版本迭代|release/g, /研发流程|开发流程/g, /AI转型|智能化|AI应用/g,
    /项目落地|项目推进/g, /数据分析|数据驱动/g, /风险管理/g, /跨部门|协同/g,
    /英语|托福|雅思/g, /AI大模型|GPT|Claude/g, /技术|编程|开发/g, /运营|产品/g
  ];
  const keywords = [];
  patterns.forEach(p => { const m = text.match(p); if (m) keywords.push(...m); });
  return [...new Set(keywords)].slice(0, 15);
}

function highlightSkills(resume, keywords) {
  let result = resume;
  keywords.forEach(k => { result = result.replace(new RegExp(k, 'gi'), `【${k}】`); });
  return result;
}

function rephraseToResultOriented(resume) {
  const replacements = [[/负责/g,'主导'],[/参与/g,'深度参与'],[/完成/g,'落地'],[/熟悉/g,'深耕'],[/掌握/g,'精通']];
  let result = resume;
  replacements.forEach(([f,t]) => { result = result.replace(f, t); });
  return result;
}

function generateOptimizedResumeLocal(resume, jd) {
  const jdKeywords = extractKeywords(jd);
  const matching = jdKeywords.filter(k => resume.toLowerCase().includes(k.toLowerCase()));
  const missing = jdKeywords.filter(k => !resume.toLowerCase().includes(k.toLowerCase()));
  const optimized = rephraseToResultOriented(resume);
  const highlighted = highlightSkills(optimized, matching);
  
  let result = `【🎯 优化后简历】\n\n📊 JD关键词分析：\n`;
  result += `   ✅ 匹配(${matching.length}个)：${matching.join('、') || '无'}\n`;
  if (missing.length > 0) result += `   💡 建议补充(${missing.length}个)：${missing.join('、')}\n\n`;
  result += `✨ 优化后的简历内容：\n${highlighted}\n\n💡 优化建议：\n`;
  result += `   - 已用【】突出匹配关键词\n`;
  if (missing.length > 0) result += `   - 建议补充"${missing.slice(0,3).join('、')}"等技能\n`;
  result += `   - 建议使用量化成果表述\n`;
  return result;
}

async function callAI(resume, jd, apiKey, endpoint) {
  const prompt = `${SYSTEM_PROMPT}\n\n简历：${resume}\n\nJD：${jd}\n\n请优化简历。`;
  const model = document.getElementById('aiModel').value;
  
  try {
    if (model === "doubao" && apiKey && endpoint) {
      const r = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: endpoint, messages: [{ role: 'user', content: prompt }] })
      });
      if (!r.ok) { alert(`API失败: ${r.status}\n${await r.text()}`); return null; }
      return (await r.json()).choices?.[0]?.message?.content;
    } else if (model === "claude" && apiKey) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: "claude-3-sonnet-20240229", max_tokens: 4096, messages: [{ role: "user", content: prompt }] })
      });
      return (await r.json()).content?.[0]?.text;
    } else if (model === "gpt" && apiKey) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: 'user', content: prompt }] })
      });
      return (await r.json()).choices?.[0]?.message?.content;
    }
  } catch (e) { alert('AI调用失败: ' + e.message); return null; }
  return null;
}

async function createPDF(text) {
  try {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.setFont(font); page.setFontSize(10);
    
    const lines = text.split('\n');
    let y = 750, lineHeight = 14;
    const green = rgb(0, 0.6, 0);
    
    for (const line of lines) {
      let x = 50;
      const parts = line.split(/(【.*?】)/g);
      for (const part of parts) {
        if (part.startsWith('【') && part.endsWith('】')) {
          page.setFillColor(green);
          page.drawText(part, { x, y });
          x += font.widthOfTextAtSize(part, 10);
          page.setFillColor(rgb(0,0,0));
        } else {
          page.drawText(part, { x, y });
          x += font.widthOfTextAtSize(part, 10);
        }
      }
      y -= lineHeight;
      if (y < 50) { const p = doc.addPage([612,792]); p.setFont(font); p.setFontSize(10); p.setFillColor(rgb(0,0,0)); y = 750; }
    }
    return await doc.save();
  } catch (e) { console.error('PDF生成失败:', e); return null; }
}

async function downloadResult(text, name) {
  try {
    const base = name.replace(/\.\w+$/, "");
    const bytes = await createPDF(text);
    if (bytes) { saveAs(new Blob([bytes], { type: "application/pdf" }), `优化后的_${base}.pdf`); return true; }
    saveAs(new Blob([text], { type: "text/plain;charset=utf-8" }), `优化后的_${base}.txt`);
    return true;
  } catch (e) { console.error('下载失败:', e); return false; }
}

document.getElementById('resumeFile').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  originalFile = file;
  document.getElementById('fileName').innerText = "已选择：" + file.name;
  
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      content.items.forEach(item => text += item.str + " ");
    }
    fileContent = text;
  } catch (e) { alert('文件读取失败'); }
};

document.getElementById('optimizeBtn').addEventListener('click', async () => {
  const jd = document.getElementById('jdInput').value.trim();
  const status = document.getElementById('status');
  const btn = document.getElementById('optimizeBtn');
  
  if (!jd) { alert('请输入JD！'); return; }
  if (!fileContent || !originalFile) { alert('请上传简历！'); return; }
  
  status.innerText = '⏳ 正在优化...';
  btn.innerText = '⏳ 优化中...';
  btn.disabled = true;
  
  const model = document.getElementById('aiModel').value;
  const apiKey = document.getElementById('aiApiKey').value.trim();
  const endpoint = document.getElementById('doubaoEndpoint').value.trim();
  
  let result = null;
  
  if (model === 'doubao' && apiKey && endpoint && endpoint.startsWith('ep-')) {
    status.innerText = '🔄 调用豆包AI...';
    result = await callAI(fileContent, jd, apiKey, endpoint);
  } else if ((model === 'claude' || model === 'gpt') && apiKey) {
    status.innerText = '🔄 调用AI...';
    result = await callAI(fileContent, jd, apiKey, null);
  }
  
  if (!result) { result = generateOptimizedResumeLocal(fileContent, jd); }
  
  document.getElementById('resultOutput').value = result;
  btn.innerText = '🚀 一键优化并下载';
  btn.disabled = false;
  
  status.innerText = '💾 正在下载...';
  const success = await downloadResult(result, originalFile.name);
  status.innerText = success ? '✅ 已下载' : '✅ 优化完成';
  status.className = success ? 'status success' : 'status';
});

function setTheme(theme) {
  const root = document.documentElement.style;
  const themes = {
    'light-blue': {s:'#e6f0ff',e:'#f8fafc',m:'#0ea5e9'},
    'white': {s:'#ffffff',e:'#fafafa',m:'#0ea5e9'},
    'khaki': {s:'#fdf8f3',e:'#f5ebe0',m:'#c4a77d'},
    'mint': {s:'#f0fdf4',e:'#fafafa',m:'#10b981'},
    'cream': {s:'#fef3c7',e:'#fef9c3',m:'#f59e0b'},
    'lavender': {s:'#fae8ff',e:'#f5f3ff',m:'#8b5cf6'},
    'sky': {s:'#dbeafe',e:'#eff6ff',m:'#3b82f6'},
    'sage': {s:'#ecfdf5',e:'#f0fdf4',m:'#34d399'},
    'butter': {s:'#fef9c3',e:'#fefce8',m:'#eab308'}
  };
  const t = themes[theme] || themes['light-blue'];
  root.setProperty("--bg-gradient-start", t.s);
  root.setProperty("--bg-gradient-end", t.e);
  root.setProperty("--main", t.m);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function setAIConfig() {
  const model = document.getElementById('aiModel').value;
  const key = document.getElementById('aiApiKey').value.trim();
  const endpoint = document.getElementById('doubaoEndpoint').value.trim();
  
  document.getElementById('doubaoEndpointRow').style.display = model === 'doubao' ? 'flex' : 'none';
  
  const names = { 'doubao': '豆包', 'claude': 'Claude', 'gpt': 'GPT' };
  const status = document.getElementById('aiStatus');
  
  if (model === 'doubao') {
    if (key && endpoint) {
      if (endpoint.startsWith('ep-')) {
        status.innerText = '✅ 已配置豆包';
        status.className = 'status success';
      } else {
        status.innerText = '⚠️ Endpoint格式错误';
        status.className = 'status warning';
      }
    } else if (key) {
      status.innerText = '⚠️ 请输入Endpoint';
      status.className = 'status warning';
    } else {
      status.innerText = '⚠️ 未配置AI，将使用本地优化';
      status.className = 'status';
    }
  } else if (key) {
    status.innerText = `✅ 已配置${names[model]}`;
    status.className = 'status success';
  } else {
    status.innerText = '⚠️ 未配置AI，将使用本地优化';
    status.className = 'status';
  }
}
