const SYSTEM_PROMPT = `你是专业互联网简历优化师，擅长根据JD优化简历。
规则：
1. 保留真实经历，只优化表达，不编造。
2. 语言风格：干练、结果导向、强执行、高亮点。
3. 必须匹配JD关键词，突出相关技能和经历。
`;

let fileContent = "";
let originalFile = null;
let fileType = "";

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
    [/负责|担任|参与/g, '主导'],
    [/完成|实现/g, '落地'],
    [/协助|支持/g, '赋能'],
    [/学习|了解/g, '精通'],
    [/熟悉|掌握/g, '深耕']
  ];
  
  let result = resume;
  replacements.forEach(([from, to]) => {
    result = result.replace(from, to);
  });
  
  return result;
}

function generateOptimizedResume(resume, jd) {
  const jdKeywords = extractKeywords(jd);
  const resumeKeywords = extractKeywords(resume);
  
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
    optimized += `   ⚠️ 建议补充(${missingKeywords.length}个)：${missingKeywords.join('、')}\n\n`;
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
  optimized += `   - 建议使用量化成果表述（如：完成XX项目，提升XX%效率，节省XX成本）\n`;
  optimized += `   - 突出"结果导向"的工作成果描述，多用数据说话\n`;
  optimized += `   - 动词替换：将"负责"改为"主导"，"参与"改为"推动"\n`;
  
  return optimized;
}

document.getElementById('resumeFile').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  originalFile = file;
  document.getElementById('fileName').innerText = "已选择：" + file.name;

  if (file.name.endsWith(".pdf")) {
    fileType = "pdf";
    fileContent = await readPDF(file);
  } else {
    fileType = "txt";
    const reader = new FileReader();
    reader.onload = (ev) => { fileContent = ev.target.result; };
    reader.readAsText(file);
  }
};

async function readPDF(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach(item => text += item.str + " ");
  }
  return text;
}

document.getElementById('optimizeBtn').addEventListener('click', () => {
  const jd = document.getElementById('jdInput').value.trim();
  const resume = fileContent || document.getElementById('resultOutput').placeholder;
  
  if (!jd) {
    alert('请输入JD！');
    return;
  }
  
  if (!fileContent) {
    alert('请上传简历文件！');
    return;
  }
  
  document.getElementById('status').innerText = '⏳ 正在优化...';
  document.getElementById('optimizeBtn').innerText = '⏳ 优化中...';
  document.getElementById('optimizeBtn').disabled = true;
  
  setTimeout(() => {
    const optimized = generateOptimizedResume(fileContent, jd);
    document.getElementById('resultOutput').value = optimized;
    document.getElementById('status').innerText = '✅ 优化完成';
    document.getElementById('optimizeBtn').innerText = '🚀 一键优化简历';
    document.getElementById('optimizeBtn').disabled = false;
  }, 800);
});

function setTheme(theme) {
  const root = document.documentElement.style;
  const colors = {
    blue: { main: "#0ea5e9", light: "#e0f2fe" },
    green: { main: "#10b981", light: "#d1fae5" },
    purple: { main: "#8b5cf6", light: "#f0e7ff" },
    orange: { main: "#f97316", light: "#ffefd8" }
  };
  root.setProperty("--main", colors[theme].main);
  root.setProperty("--light", colors[theme].light);
}
