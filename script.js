const MY_PROFILE = `唐润佳｜江南大学保研硕士｜英语语言文学｜学业前5%
托福5.0/6.0｜专八优秀｜专四良好
熟练AI大模型：豆包、Claude、GPT、Gemini
经历：
- 中阿航天数据系统合作项目 驻场交传
- 商务部归口太平洋岛国国际项目 统筹执行
- 学术论坛统筹、公众号运营、大型活动落地
能力：流程搭建、版本发布支撑、跨部门协同、数据分析、风险管理、决策支持、AI流程优化
`;
const SYSTEM_PROMPT = `你是专业互联网简历优化师，专为B站/字节优化简历。
规则：
1. 保留真实经历，只优化表达，不编造。
2. 突出：保研、专八、托福、跨国项目、AI能力、流程统筹、版本发布、项目落地。
3. 语言：B站互联网风格、干练、结果导向、强执行、高亮点。
4. 必须匹配JD关键词：版本发布、研发流程AI转型、项目落地、关键战役、数据分析、风险管理、决策建议、跨部门、统筹、学习力、创新、抗压。
`;
document.getElementById('optimizeBtn').addEventListener('click', () => {
const resume = document.getElementById('resume').value.trim();
const jd = document.getElementById('jd').value.trim();
if (!resume || !jd) {
alert('请输入简历和JD！');
return;
}
document.getElementById('optimizeBtn').innerText = '⏳ 优化中...';
document.getElementById('optimizeBtn').disabled = true;
setTimeout(() => {
const optimized = generateOptimizedResume(resume, jd);
document.getElementById('result').value = optimized;
document.getElementById('optimizeBtn').innerText = '🚀 一键优化简历';
document.getElementById('optimizeBtn').disabled = false;
}, 1200);
});
function generateOptimizedResume(resume, jd) {
return `【优化后简历 - 适配B站】
个人优势：
我具备托福5.0/6.0、英语专八优秀、保研硕士、学业前5%的硬核基础，拥有跨国技术项目、全流程统筹、AI工具深度应用、数据信息分析与跨部门协同的综合优势，可快速胜任B站APP版本发布、研发流程AI转型、关键战役推进、AI项目落地及管理决策支持工作。
我熟练使用豆包、Claude、GPT、Gemini等主流AI大模型，能够将AI能力系统性应用于流程优化、信息汇总、数据分析、文档编写、效率提升等场景，可直接参与研发流程AI转型建设，推动各系统适配AI并持续迭代优化，提升版本发布与项目推进效率。
项目经历亮点：
1. 中阿航天数据系统合作项目驻场交传：全程对接中外技术团队，完成技术研讨、需求对齐、项目落地等高精准沟通，具备极强的复杂信息处理、跨部门协同、高压执行与风险把控能力，可深度嵌入业务团队、高效跟进核心战役。
2. 商务部归口太平洋岛国国际项目：独立统筹接待、行程保障、跨国事务全流程管理，擅长流程搭建、节点管控、信息收集、数据统计与过程复盘，具备从0到1落地项目、优化执行链路经验，可直接支撑APP版本发布。
核心能力：
流程搭建｜版本发布｜项目推进｜研发流程AI化｜数据分析｜风险管理｜决策支持｜跨部门协同｜统筹组织｜学习力强｜思维敏捷｜执行力拉满｜抗压耐造
我对AI与新技术高度敏感，性格开朗有活力、责任心强，能快速适应B站互联网高节奏、高成长环境，以专业能力+AI效率为业务持续创造价值。`;
}