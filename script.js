const SYSTEM_PROMPT = `你是专业互联网简历优化师，擅长根据JD优化简历。
规则：
1. 保留真实经历，只优化表达，不编造。
2. 语言风格：干练、结果导向、强执行、高亮点。
3. 必须匹配JD关键词，突出相关技能和经历。
4. 输出格式清晰，结构合理。
`;

let fileContent = "";
let originalFile = null;
let fileType = "";
let aiApiKey = "";
let aiModel = "doubao";
let doubaoEndpoint = "";

function extractKeywords(text) {
  const keywords = [];
  const patterns = [
    /版本发布|版本迭代|release/g,
    /研发流程|开发流程|流程优化/g,
    /AI转型|智能化|AI应用|人工智能/g,
    /项目落地|项目推进|项目管理/g,
    /关键战役|核心项目|重点任务/g,
    /数据分析|数据处理|数据驱动/g,
    /风险管理|风险控制|风险评估/g,
    /决策建议|决策支持|战略分析/g,
    /跨部门|协同|沟通/g,
    /统筹|规划|组织/g,
    /学习力|学习能力|快速学习/g,
    /创新|改进|优化/g,
    /抗压|压力|挑战/g,
    /英语|托福|雅思|专八|专四/g,
    /硕士|本科|学历/g,
    /AI大模型|GPT|Claude|Gemini|豆包/g,
    /技术|编程|开发/g,
    /运营|产品|市场/g,
    /团队管理|领导力/g,
    /项目经验|工作经历/g
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      keywords.push(...matches);
    }
  });
  
  return [...new Set(keywords)].slice(0, 15);
}

function highlightSkills(resume, jdKeywords) {
  let highlighted = resume;
  jdKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    highlighted = highlighted.replace(regex, `【${keyword}】`);
  });
  return highlighted;
}

function rephraseToResultOriented(resume) {
  const replacements = [
    [/负责/g, '主导'],
    [/担任/g, '任职于'],
    [/参与/g, '深度参与'],
    [/完成/g, '落地'],
    [/实现/g, '达成'],
    [/协助/g, '赋能支持'],
    [/支持/g, '助力'],
    [/学习/g, '深入学习'],
    [/了解/g, '掌握'],
    [/熟悉/g, '深耕'],
    [/掌握/g, '精通']
  ];
  
  let result = resume;
  replacements.forEach(([from, to]) => {
    result = result.replace(from, to);
  });
  
  return result;
}

function generateOptimizedResumeLocal(resume, jd) {
  const jdKeywords = extractKeywords(jd);
  
  const matchingKeywords = jdKeywords.filter(k => 
    resume.toLowerCase().includes(k.toLowerCase())
  );
  
  const missingKeywords = jdKeywords.filter(k => 
    !resume.toLowerCase().includes(k.toLowerCase())
  );

  const optimizedResume = rephraseToResultOriented(resume);
  const highlightedResume = highlightSkills(optimizedResume, matchingKeywords);

  let optimized = `【🎯 优化后简历】\n\n`;
  
  optimized += `📊 JD关键词分析：\n`;
  optimized += `   ✅ 匹配关键词(${matchingKeywords.length}个)：${matchingKeywords.join('、') || '无'}\n`;
  if (missingKeywords.length > 0) {
    optimized += `   💡 建议补充(${missingKeywords.length}个)：${missingKeywords.join('、')}\n\n`;
  }
  
  optimized += `✨ 优化后的简历内容：\n`;
  optimized += highlightedResume;
  optimized += `\n\n💡 优化建议：\n`;
  if (matchingKeywords.length > 0) {
    optimized += `   - 已用【】突出显示与JD匹配的关键词\n`;
  }
  if (missingKeywords.length > 0) {
    optimized += `   - 建议在简历中补充"${missingKeywords.slice(0, 3).join('、')}"等相关经历或技能\n`;
  }
  optimized += `   - 建议使用量化成果表述（如：完成XX项目，提升XX%效率）\n`;
  optimized += `   - 突出"结果导向"的工作成果描述，多用数据说话\n`;
  
  return optimized;
}

async function callAI(resume, jd, apiKey, endpoint = null) {
  const prompt = `${SYSTEM_PROMPT}\n\n简历内容：\n${resume}\n\n目标JD：\n${jd}\n\n请根据JD优化这份简历。`;
  const model = document.getElementById('aiModel').value;
  
  try {
    let response;
    
    if (model === "doubao" && apiKey && endpoint) {
      console.log('📡 正在调用豆包API...');
      console.log('  - Endpoint:', endpoint);
      console.log('  - API Key:', apiKey.substring(0, 10) + '...');
      
      response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: endpoint,
          messages: [{ role: 'user', content: prompt }],
          stream: false
        })
      });
      
      console.log('  - 响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 豆包API错误:', response.status, errorText);
        alert(`API调用失败: ${response.status}\n${errorText}`);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ API响应:', data);
      return data.choices?.[0]?.message?.content;
    } else if (model === "claude" && apiKey) {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }]
        })
      });
      
      const data = await response.json();
      return data.content?.[0]?.text;
    } else if (model === "gpt" && apiKey) {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }]
        })
      });
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content;
    }
  } catch (error) {
    console.error('❌ AI调用失败:', error);
    alert('AI调用失败: ' + error.message);
    return null;
  }
  
  return null;
}

async function createPDF(text) {
  try {
    const { PDFDocument, StandardFonts } = PDFLib;
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.setFont(font);
    page.setFontSize(10);
    
    const lines = text.split('\n');
    let y = 750;
    const lineHeight = 14;
    
    for (const line of lines) {
      page.drawText(line, { x: 50, y: y, maxWidth: 500 });
      y -= lineHeight;
      if (y < 50) {
        const newPage = doc.addPage([612, 792]);
        newPage.setFont(font);
        newPage.setFontSize(10);
        y = 750;
      }
    }
    
    return await doc.save();
  } catch (error) {
    console.error('PDF生成失败:', error);
    return null;
  }
}

async function downloadResult(text, originalFileName) {
  try {
    const name = originalFileName.replace(/\.\w+$/, "");
    
    if (fileType === "pdf") {
      const bytes = await createPDF(text);
      if (bytes) {
        saveAs(new Blob([bytes], { type: "application/pdf" }), `优化后的_${name}.pdf`);
        return true;
      } else {
        saveAs(new Blob([text], { type: "text/plain;charset=utf-8" }), `优化后的_${name}.txt`);
        return true;
      }
    } else {
      saveAs(new Blob([text], { type: "text/plain;charset=utf-8" }), `优化后的_${name}.txt`);
      return true;
    }
  } catch (error) {
    console.error('下载失败:', error);
    return false;
  }
}

document.getElementById('resumeFile').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  originalFile = file;
  document.getElementById('fileName').innerText = "已选择：" + file.name;

  try {
    if (file.name.endsWith(".pdf")) {
      fileType = "pdf";
      fileContent = await readPDF(file);
    } else {
      fileType = "txt";
      const reader = new FileReader();
      reader.onload = (ev) => { fileContent = ev.target.result; };
      reader.readAsText(file);
    }
  } catch (error) {
    console.error('文件读取失败:', error);
    alert('文件读取失败，请尝试其他文件');
  }
};

async function readPDF(file) {
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      content.items.forEach(item => text += item.str + " ");
    }
    return text;
  } catch (error) {
    console.error('PDF读取失败:', error);
    return "";
  }
}

document.getElementById('optimizeBtn').addEventListener('click', async () => {
  const jd = document.getElementById('jdInput').value.trim();
  const statusEl = document.getElementById('status');
  const btnEl = document.getElementById('optimizeBtn');
  
  if (!jd) {
    alert('请输入JD！');
    return;
  }
  
  if (!fileContent || !originalFile) {
    alert('请上传简历文件！');
    return;
  }
  
  statusEl.innerText = '⏳ 正在优化...';
  btnEl.innerText = '⏳ 优化中...';
  btnEl.disabled = true;
  
  const currentModel = document.getElementById('aiModel').value;
  const currentApiKey = document.getElementById('aiApiKey').value.trim();
  const currentEndpoint = document.getElementById('doubaoEndpoint').value.trim();
  
  console.log('🚀 开始优化:', {
    model: currentModel,
    apiKeySet: currentApiKey.length > 0,
    endpointSet: currentEndpoint.length > 0,
    endpointValid: currentEndpoint.startsWith('ep-')
  });
  
  let result = null;
  
  if (currentModel === 'doubao' && currentApiKey && currentEndpoint && currentEndpoint.startsWith('ep-')) {
    statusEl.innerText = '🔄 正在调用豆包AI...';
    result = await callAI(fileContent, jd, currentApiKey, currentEndpoint);
    if (result) {
      statusEl.innerText = '✅ AI优化完成';
    }
  } else if ((currentModel === 'claude' || currentModel === 'gpt') && currentApiKey) {
    statusEl.innerText = '🔄 正在调用AI...';
    result = await callAI(fileContent, jd, currentApiKey, null);
    if (result) {
      statusEl.innerText = '✅ AI优化完成';
    }
  }
  
  if (!result) {
    result = generateOptimizedResumeLocal(fileContent, jd);
    if (currentApiKey && !result) {
      statusEl.innerText = '✅ 本地优化完成';
    } else {
      statusEl.innerText = '✅ 优化完成';
    }
  }
  
  document.getElementById('resultOutput').value = result;
  btnEl.innerText = '🚀 一键优化并下载';
  btnEl.disabled = false;
  
  statusEl.innerText = '💾 正在下载...';
  const downloadSuccess = await downloadResult(result, originalFile.name);
  
  if (downloadSuccess) {
    statusEl.innerText = '✅ 已下载';
    statusEl.className = 'status success';
  } else {
    statusEl.innerText = '✅ 优化完成';
    statusEl.className = 'status';
  }
});

function setTheme(theme) {
  const root = document.documentElement.style;
  const themes = {
    'light-blue': { start: '#e6f0ff', end: '#f8fafc', main: '#0ea5e9', light: '#e0f2fe' },
    'white': { start: '#ffffff', end: '#fafafa', main: '#0ea5e9', light: '#e0f2fe' },
    'khaki': { start: '#fdf8f3', end: '#f5ebe0', main: '#c4a77d', light: '#f5ebe0' },
    'mint': { start: '#f0fdf4', end: '#fafafa', main: '#10b981', light: '#d1fae5' },
    'cream': { start: '#fef3c7', end: '#fef9c3', main: '#f59e0b', light: '#fef3c7' },
    'lavender': { start: '#fae8ff', end: '#f5f3ff', main: '#8b5cf6', light: '#f0e7ff' },
    'sky': { start: '#dbeafe', end: '#eff6ff', main: '#3b82f6', light: '#dbeafe' },
    'sage': { start: '#ecfdf5', end: '#f0fdf4', main: '#34d399', light: '#d1fae5' },
    'butter': { start: '#fef9c3', end: '#fefce8', main: '#eab308', light: '#fef9c3' }
  };
  
  const t = themes[theme] || themes['light-blue'];
  root.setProperty("--bg-gradient-start", t.start);
  root.setProperty("--bg-gradient-end", t.end);
  root.setProperty("--bg", t.start);
  root.setProperty("--main", t.main);
  root.setProperty("--light", t.light);
  
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function setAIConfig() {
  const model = document.getElementById('aiModel').value;
  const key = document.getElementById('aiApiKey').value;
  const endpoint = document.getElementById('doubaoEndpoint').value;
  
  aiModel = model;
  aiApiKey = key.trim();
  doubaoEndpoint = endpoint.trim();
  
  console.log('🔧 配置更新:', {
    model: model,
    apiKeyLength: aiApiKey.length,
    endpoint: doubaoEndpoint,
    endpointValid: doubaoEndpoint.startsWith('ep-')
  });
  
  const modelNames = {
    'doubao': '豆包',
    'claude': 'Claude',
    'gpt': 'GPT'
  };
  
  const doubaoEndpointRow = document.getElementById('doubaoEndpointRow');
  doubaoEndpointRow.style.display = model === 'doubao' ? 'flex' : 'none';
  
  if (aiModel === 'doubao') {
    if (aiApiKey && doubaoEndpoint) {
      if (doubaoEndpoint.startsWith('ep-')) {
        document.getElementById('aiStatus').innerText = '✅ 已配置豆包 (API Key + Endpoint ID)';
        document.getElementById('aiStatus').className = 'status success';
        console.log('✅ 豆包配置完成');
      } else {
        document.getElementById('aiStatus').innerText = '⚠️ Endpoint ID格式错误！应为 ep-xxxxxx 格式';
        document.getElementById('aiStatus').className = 'status warning';
      }
    } else if (aiApiKey) {
      document.getElementById('aiStatus').innerText = '⚠️ 请输入Endpoint ID（推理接入点ID）';
      document.getElementById('aiStatus').className = 'status warning';
    } else {
      document.getElementById('aiStatus').innerText = '⚠️ 未配置AI，将使用本地优化';
      document.getElementById('aiStatus').className = 'status';
    }
  } else if (aiApiKey) {
    document.getElementById('aiStatus').innerText = `✅ 已配置${modelNames[model]} API`;
    document.getElementById('aiStatus').className = 'status success';
  } else {
    document.getElementById('aiStatus').innerText = '⚠️ 未配置AI，将使用本地优化';
    document.getElementById('aiStatus').className = 'status';
  }
}
