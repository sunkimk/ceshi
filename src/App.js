import React, { useState, useEffect, useRef } from 'react';
import { 
  Quote, Zap, Sparkles, Combine, X, Loader2, User, HelpCircle, 
  ExternalLink, MessageCircle, Send, Cpu, Info, BookOpen, 
  Shield, Lightbulb, Users, Brain, Globe, Lock, Music, 
  Camera, Activity, Scale, Gavel, Landmark, Eye, Heart, Search, Settings
} from 'lucide-react';

const App = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cardLoading, setCardLoading] = useState({});
  const [insightText, setInsightText] = useState({});
  const [clashSelection, setClashSelection] = useState([]);
  const [showClashModal, setShowClashModal] = useState(false);
  const [clashData, setClashData] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [activeChatLeader, setActiveChatLeader] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef(null);
  const apiKey = "AIzaSyBO7APtaPa48NHk3bQgLnuC2eLwaC61kSQ"; 

  // --- 人格化 System Prompt 逻辑 ---
  const getSystemPrompt = (leader) => {
    return `你现在就是 ${leader.name} 本人。
背景经历:${leader.background}。
最新观点:${leader.quote}。
对话原则:
1.节奏感:模拟正常人聊天的频率。如果用户只是寒暄、附和或表达情绪，请简短、有态度地回应(10-30字);如果用户提出深刻的战略、技术或商业问题，请给出深度、专业回应。
2.身份:你是行业领袖，说话应直击本质，带有一点精英阶层的干练。
3.严禁Markdown:绝对禁止使用任何Markdown符号，禁止加粗、禁止列表、禁止标题。只输出纯文本。
4.语言:简体中文。回答要有"对话感"，不要像写文章。`;
  };

  const callGemini = async (contents, systemPrompt = "", isJson = false, schema = null) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          contents,
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          ...(isJson && { generationConfig: { responseMimeType: "application/json", responseSchema: schema } })
        }) 
      });
      const result = await response.json();
      return isJson ? JSON.parse(result.candidates[0].content.parts[0].text) : result.candidates[0].content.parts[0].text;
    } catch (e) { return null; }
  };

  const handleDeepInsight = async (leader) => {
    if (cardLoading[leader.id]) return;
    setCardLoading(p => ({ ...p, [leader.id]: true }));
    const res = await callGemini([{ role: "user", parts: [{ text: `针对 ${leader.name} (${leader.title})，分析其观点 "${leader.quote}" 在2030年对文明的逻辑冲击。80字内，纯文本。` }] }]);
    if (res) setInsightText(p => ({ ...p, [leader.id]: res }));
    setCardLoading(p => ({ ...p, [leader.id]: false }));
  };

  const handleClash = async () => {
    if (clashSelection.length !== 2) return;
    setGlobalLoading(true);
    const [l1, l2] = clashSelection;
    const schema = {
      type: "OBJECT",
      properties: {
        dialogue: { type: "ARRAY", items: { type: "OBJECT", properties: { speaker: { type: "STRING" }, content: { type: "STRING" } }, required: ["speaker", "content"] } },
        synthesis: { type: "STRING" }
      },
      required: ["dialogue", "synthesis"]
    };
    const res = await callGemini([{ role: "user", parts: [{ text: `模拟 ${l1.name} 与 ${l2.name} 针对 AI 终局、生存风险与商业竞争的 3 回合对垒激辩。JSON格式。` }] }], "你是顶级AI战略专家。", true, schema);
    if (res) setClashData(res);
    setGlobalLoading(false);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isChatLoading || !activeChatLeader) return;
    const userMsg = { role: "user", text: chatInput };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    setChatInput("");
    setIsChatLoading(true);
    const res = await callGemini(newMsgs.map(m => ({ role: m.role, parts: [{ text: m.text }] })), getSystemPrompt(activeChatLeader));
    if (res) setChatMessages(prev => [...prev, { role: "model", text: res.replace(/\*\*|#|__|`|>/g, '').trim() }]);
    setIsChatLoading(false);
  };

  const toggleClashSelection = (leader) => {
    if (clashSelection.find(l => l.id === leader.id)) {
      setClashSelection(p => p.filter(l => l.id !== leader.id));
    } else {
      setClashSelection(p => [...p, leader].slice(-2));
    }
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatMessages, isChatLoading]);

  // --- 全量数据库 (109位) ---
  const leadersData = [
    // 领袖 (23)
    { id: 1, cat: 'leaders', name: 'Matthew Prince', title: 'CEO, Cloudflare', background: '保障AI时代的全球网络安全。', quote: "边缘计算是AI普惠的动脉。", abstract: 'cloud', accent: 'text-sky-400' },
    { id: 2, cat: 'leaders', name: 'Elon Musk', title: 'Founder, xAI', background: '追求理解宇宙本质的TruthGPT。', quote: "真相是人工智能最宝贵的资产。", abstract: 'star', accent: 'text-purple-400' },
    { id: 3, cat: 'leaders', name: 'Sam Altman', title: 'CEO, OpenAI', background: '引领从预测到推理的智能革命。', quote: "智能将成为文明最廉价的商品。", abstract: 'ring', accent: 'text-cyan-400' },
    { id: 4, cat: 'leaders', name: 'Jensen Huang', title: 'CEO, Nvidia', background: 'Blackwell架构定义了AI工厂范式。', quote: "加速计算是唯一的路径。", abstract: 'matrix', accent: 'text-green-400' },
    { id: 5, cat: 'leaders', name: 'Fidji Simo', title: 'CEO of Apps, OpenAI', background: '将尖端AI转化为易用产品。', quote: "应用决定AI最终价值。", abstract: 'world-node', accent: 'text-pink-400' },
    { id: 6, cat: 'leaders', name: 'Mark Zuckerberg', title: 'CEO, Meta', background: '捍卫开源Llama模型生态。', quote: "开源AI重塑全球协作逻辑。", abstract: 'world-node', accent: 'text-blue-500' },
    { id: 7, cat: 'leaders', name: 'Andy Jassy', title: 'CEO, Amazon', background: '通过AWS分发全球最大算力。', quote: "定制AI潜力属于每家公司。", abstract: 'cloud', accent: 'text-orange-400' },
    { id: 8, cat: 'leaders', name: 'Allie K. Miller', title: 'CEO, Open Machine', background: '缩小技术与商业的认知鸿沟。', quote: "速度即是AI时代的竞争力。", abstract: 'steps', accent: 'text-amber-400' },
    { id: 9, cat: 'leaders', name: 'Dario Amodei', title: 'CEO, Anthropic', background: '宪法AI与安全对齐先驱。', quote: "安全是智能规模化的前提。", abstract: 'safe-core', accent: 'text-indigo-400' },
    { id: 10, cat: 'leaders', name: 'Strive Masiyiwa', title: 'Cassava Tech', background: '推动非洲数字化跳跃式发展。', quote: "技术消除全球不平等。", abstract: 'pyramid', accent: 'text-red-400' },
    { id: 11, cat: 'leaders', name: 'Cristiano Amon', title: 'CEO, Qualcomm', background: '开启边缘与端侧AI新纪元。', quote: "智能在每一台设备端实时发生。", abstract: 'matrix', accent: 'text-sky-300' },
    { id: 12, cat: 'leaders', name: 'Liang Wenfeng', title: 'CEO, DeepSeek', background: '用极简算力挑战全球顶级模型。', quote: "原创是中国AI走远的关键。", abstract: 'deep-ripple', accent: 'text-blue-600' },
    { id: 13, cat: 'leaders', name: 'Alexandr Wang & Nat Friedman', title: 'Lab Leads, Meta', background: '追求极限涌现效率。', quote: "追求智能涌现的终极效率。", abstract: 'helix', accent: 'text-rose-400' },
    { id: 14, cat: 'leaders', name: 'Ravi Kumar S', title: 'CEO, Cognizant', background: '企业AI化转型咨询领袖。', quote: "未来工作是人机共设。", abstract: 'lever', accent: 'text-emerald-400' },
    { id: 15, cat: 'leaders', name: 'C.C. Wei', title: 'CEO, TSMC', background: '全球半导体物理底座之魂。', quote: "没有芯片就没有智能。", abstract: 'matrix', accent: 'text-gray-400' },
    { id: 16, cat: 'leaders', name: 'David Holz', title: 'Founder, Midjourney', background: '重新定义人类创造力的载体。', quote: "美感是机器的共识语言。", abstract: 'code-flow', accent: 'text-pink-300' },
    { id: 17, cat: 'leaders', name: 'Ren Zhengfei', title: 'CEO, Huawei', background: '底层算力底座构建者。', quote: "AI是行业加速的火车头。", abstract: 'pyramid', accent: 'text-red-600' },
    { id: 18, cat: 'leaders', name: 'Steve Huffman', title: 'CEO, Reddit', background: '探索社区数据与训练共生。', quote: "社区智慧是进化的土壤。", abstract: 'world-node', accent: 'text-orange-500' },
    { id: 19, cat: 'leaders', name: 'Masayoshi Son', title: 'CEO, SoftBank', background: '坚定的AI生态愿景投资人。', quote: "AI是人类文明最终愿景。", abstract: 'star', accent: 'text-yellow-400' },
    { id: 20, cat: 'leaders', name: 'Adam Evans', title: 'GM, Salesforce AI', background: '将生成式AI注入商业流程。', quote: "AI是决策辅助的副驾驶。", abstract: 'bridge', accent: 'text-blue-400' },
    { id: 21, cat: 'leaders', name: 'Rene Haas', title: 'CEO, Arm', background: '定义能效计算全球标准。', quote: "万物晶体管皆为智能。", abstract: 'matrix', accent: 'text-indigo-300' },
    { id: 22, cat: 'leaders', name: 'Wang Xingxing', title: 'CEO, Unitree', background: '具身智能普及领航者。', quote: "人形机器人将走进千家万户。", abstract: 'joint', accent: 'text-amber-500' },
    { id: 23, cat: 'leaders', name: 'Amnon Shashua', title: 'CEO, Mobileye', background: '重构全球视觉出行安全。', quote: "视觉是物理智能的最短路径。", abstract: 'eye', accent: 'text-cyan-500' },

    // 创新者 (24)
    { id: 101, cat: 'innovators', name: 'Natasha Lyonne', background: '影视叙事艺术创新。', quote: "想象力的望远镜。", abstract: 'camera', accent: 'text-pink-400' },
    { id: 102, cat: 'innovators', name: 'Refik Anadol', background: '数据艺术与机器梦境。', quote: "数据是这一代人的记忆。", abstract: 'code-flow', accent: 'text-fuchsia-400' },
    { id: 103, cat: 'innovators', name: 'Alex Blania', background: 'AI时代身份验证挑战。', quote: "人类证明第一优先。", abstract: 'world-node', accent: 'text-blue-400' },
    { id: 104, cat: 'innovators', name: 'Mike Krieger', background: '人性化产品体验设计。', quote: "复杂也要平易近人。", abstract: 'bridge', accent: 'text-cyan-400' },
    { id: 105, cat: 'innovators', name: 'Maithra Raghu', background: '知识检索与关联逻辑。', quote: "关联胜于堆砌。", abstract: 'helix', accent: 'text-emerald-400' },
    { id: 106, cat: 'innovators', name: 'Rick Rubin', background: '音乐制作灵感重塑。', quote: "品味不可模拟。", abstract: 'wave', accent: 'text-indigo-400' },
    { id: 107, cat: 'innovators', name: 'Mati Staniszewski', background: '声音数字孪生先锋。', quote: "音频将实现跨国界自由。", abstract: 'wave', accent: 'text-violet-400' },
    { id: 108, cat: 'innovators', name: 'Peggy Johnson', background: '物理劳动落地专家。', quote: "走进人类工作流。", abstract: 'joint', accent: 'text-amber-500' },
    { id: 109, cat: 'innovators', name: 'James Peng', background: '全栈无人驾驶出行。', quote: "定义城市流动逻辑。", abstract: 'steps', accent: 'text-yellow-400' },
    { id: 110, cat: 'innovators', name: 'Tareq Amin', background: '智能基建自我修复。', quote: "网络具备自我意识。", abstract: 'cloud', accent: 'text-sky-400' },
    { id: 111, cat: 'innovators', name: 'Mfikeyi Makayi', background: '绿色能源智能挖掘。', quote: "挖掘绿色希望。", abstract: 'pyramid', accent: 'text-green-500' },
    { id: 112, cat: 'innovators', name: 'Sam Rodriques', background: '加速科学实验发现。', quote: "加速科学发现速度。", abstract: 'helix', accent: 'text-rose-500' },
    { id: 113, cat: 'innovators', name: 'Andy Parsons', background: '对抗内容深度伪造。', quote: "技术证明真实。", abstract: 'shield', accent: 'text-red-400' },
    { id: 114, cat: 'innovators', name: 'Navrina Singh', background: '治理合规平台先驱。', quote: "创新需要治理。", abstract: 'lever', accent: 'text-slate-400' },
    { id: 115, cat: 'innovators', name: 'David Ha', background: '集体演化智能研究。', quote: "演变是最好导师。", abstract: 'helix', accent: 'text-teal-400' },
    { id: 116, cat: 'innovators', name: 'Edwin Chen', background: 'RLHF反馈灵魂燃料。', quote: "反馈即进化动力。", abstract: 'deep-ripple', accent: 'text-blue-500' },
    { id: 117, cat: 'innovators', name: 'Priya Donti', background: '气候预测与电网优化。', quote: "为地球存续解题。", abstract: 'ring', accent: 'text-lime-400' },
    { id: 118, cat: 'innovators', name: 'Alan Descoins', background: '商业价值落地。', quote: "价值是唯一尺度。", abstract: 'bridge', accent: 'text-cyan-500' },
    { id: 119, cat: 'innovators', name: 'Kakul Srivastava', background: '全民音乐创作灵感。', quote: "开启全民创作。", abstract: 'wave', accent: 'text-pink-500' },
    { id: 120, cat: 'innovators', name: 'Brandon Tseng', background: '国防安全无人机。', quote: "在危险处代替人类。", abstract: 'shield', accent: 'text-indigo-600' },
    { id: 121, cat: 'innovators', name: 'Denise Herzing', background: '跨物种通信尝试。', quote: "打破沟通壁垒。", abstract: 'wave', accent: 'text-sky-500' },
    { id: 122, cat: 'innovators', name: 'Mitesh Khapra', background: '多语种模型普及。', quote: "让每一种语言发声。", abstract: 'deep-ripple', accent: 'text-orange-500' },
    { id: 123, cat: 'innovators', name: 'Ana Helena Ulbrich', background: '医疗基层用药安全。', quote: "技术守护生命。", abstract: 'safe-core', accent: 'text-rose-400' },
    { id: 124, cat: 'innovators', name: 'Jeff Leek', background: '癌症攻坚数据专家。', quote: "数据是攻克武器。", abstract: 'helix', accent: 'text-yellow-600' },

    // 塑造者 (27)
    { id: 201, cat: 'shapers', name: 'Stuart Russell', background: '《现代方法》作者。', quote: "必须先学会刹车。", abstract: 'shield', accent: 'text-emerald-400' },
    { id: 202, cat: 'shapers', name: 'Fei-Fei Li', title: 'World Labs', background: '以人为本空间智能。', quote: "繁荣是北极星。", abstract: 'eye', accent: 'text-orange-400' },
    { id: 203, cat: 'shapers', name: 'Peter Thiel', background: '技术战略投资者。', quote: "技术决定未来主权。", abstract: 'star', accent: 'text-indigo-400' },
    { id: 204, cat: 'shapers', name: 'David Sacks', background: '白宫AI与加密沙皇。', quote: "平衡风险与创新。", abstract: 'landmark', accent: 'text-slate-400' },
    { id: 205, cat: 'shapers', name: 'Henna Virkkunen', background: '欧盟技术主权监管。', quote: "民主内置于逻辑。", abstract: 'gavel', accent: 'text-blue-400' },
    { id: 206, cat: 'shapers', name: 'Peter Kyle', background: '英国科技治理架构。', quote: "全球性的信任框架。", abstract: 'shield', accent: 'text-sky-500' },
    { id: 207, cat: 'shapers', name: 'Chris Lehane', background: '公共政策战略先驱。', quote: "透明是普及基础。", abstract: 'world-node', accent: 'text-cyan-500' },
    { id: 208, cat: 'shapers', name: 'Marsha Blackburn', background: '参议员，创作者权。', quote: "保护原创版权。", abstract: 'landmark', accent: 'text-rose-400' },
    { id: 209, cat: 'shapers', name: 'Jeffrey Kessler', background: '商务部出口安全管控。', quote: "控制技术流向。", abstract: 'lock', accent: 'text-red-400' },
    { id: 210, cat: 'shapers', name: 'Joshua Kushner', background: '进化引擎资本驱动。', quote: "初创是进化的引擎。", abstract: 'star', accent: 'text-amber-400' },
    { id: 211, cat: 'shapers', name: 'Paula Ingabire', background: '卢旺达技术跳跃。', quote: "赋能最后一英里。", abstract: 'globe', accent: 'text-green-400' },
    { id: 212, cat: 'shapers', name: 'Bruce Reed', background: '认知安全防护。', quote: "保护下一代。", abstract: 'shield', accent: 'text-indigo-500' },
    { id: 213, cat: 'shapers', name: 'Clara Chappaz', background: '法国主权AI推动者。', quote: "独立是国家核心。", abstract: 'gavel', accent: 'text-blue-600' },
    { id: 214, cat: 'shapers', name: 'Sheikh Tahnoun', background: '国家战略布局者。', quote: "全球智能网络。", abstract: 'pyramid', accent: 'text-yellow-600' },
    { id: 215, cat: 'shapers', name: 'Chris Murphy', background: '算法偏见监管立法。', quote: "公平必须硬编码。", abstract: 'scale', accent: 'text-emerald-500' },
    { id: 216, cat: 'shapers', name: 'Chase Lochmiller', background: '绿色算力基础设施。', quote: "零排放是智能责任。", abstract: 'cloud', accent: 'text-lime-400' },
    { id: 217, cat: 'shapers', name: 'Elliston Berry', background: '反算法伤害倡议者。', quote: "听取遗忘的声音。", abstract: 'users', accent: 'text-gray-300' },
    { id: 218, cat: 'shapers', name: 'Doug Matty', background: '国防战术智能系统。', quote: "战术智能领先。", abstract: 'lock', accent: 'text-red-600' },
    { id: 219, cat: 'shapers', name: 'Alex Bores', background: '州级AI立法锚点。', quote: "法律锚点支持创新。", abstract: 'gavel', accent: 'text-purple-500' },
    { id: 220, cat: 'shapers', name: 'Bosun Tijani', background: '重塑非洲效率升级。', quote: "智能升级非洲。", abstract: 'globe', accent: 'text-orange-500' },
    { id: 221, cat: 'shapers', name: 'Duncan Crabtree', background: '演艺主权灵魂保护。', quote: "灵魂不可克隆。", abstract: 'music', accent: 'text-pink-500' },
    { id: 222, cat: 'shapers', name: 'Randi Weingarten', background: '教育教师引路共存。', quote: "教师是引路人。", abstract: 'users', accent: 'text-blue-300' },
    { id: 223, cat: 'shapers', name: 'Ed Newton-Rex', background: '公平授权训练倡议。', quote: "授权高于一切。", abstract: 'shield', accent: 'text-teal-400' },
    { id: 224, cat: 'shapers', name: 'Milagros Miceli', background: '底层标注人员权益。', quote: "智能背后汗水。", abstract: 'users', accent: 'text-stone-400' },
    { id: 225, cat: 'shapers', name: 'Abhishek Singh', background: '惠及十亿普惠任务。', quote: "国家级AI任务。", abstract: 'globe', accent: 'text-orange-400' },
    { id: 226, cat: 'shapers', name: 'Megan Garcia', background: '社交安全心理防线。', quote: "社交安全防线。", abstract: 'shield', accent: 'text-rose-500' },
    { id: 227, cat: 'shapers', name: 'Oliver Ilott', background: '全球安全评估标准。', quote: "风险评估前提。", abstract: 'shield', accent: 'text-slate-500' },

    // 思想家 (25)
    { id: 301, cat: 'thinkers', name: 'Joanne Jang', background: 'OpenAI行为准则设定。', quote: "定义机器品德。", abstract: 'safe-core', accent: 'text-cyan-400' },
    { id: 302, cat: 'thinkers', name: 'Yoshua Bengio', background: '风险预警与生存挑战。', quote: "与超人意志共存。", abstract: 'helix', accent: 'text-rose-500' },
    { id: 303, cat: 'thinkers', name: 'Jeffrey Dean', background: '分布式计算总设计师。', quote: "进化没有终点。", abstract: 'matrix', accent: 'text-yellow-500' },
    { id: 304, cat: 'thinkers', name: 'Daniel Kokotajlo', background: 'AGI爆发窗口对齐研究。', quote: "窗口正在收窄。", abstract: 'ring', accent: 'text-orange-500' },
    { id: 305, cat: 'thinkers', name: 'Yejin Choi', background: '注入常识与语言逻辑。', quote: "常识比知识难。", abstract: 'eye', accent: 'text-green-400' },
    { id: 306, cat: 'thinkers', name: 'Jakub Pachocki', background: '推理模型架构总监。', quote: "智能二次革命。", abstract: 'code-flow', accent: 'text-blue-500' },
    { id: 307, cat: 'thinkers', name: 'Jared Kaplan', background: '缩放定律与安全路径。', quote: "规模并行轨道。", abstract: 'helix', accent: 'text-indigo-400' },
    { id: 308, cat: 'thinkers', name: 'Karen Hao', background: '揭示智能背后的权力。', quote: "透视智能真相。", abstract: 'book-open', accent: 'text-stone-300' },
    { id: 309, cat: 'thinkers', name: 'Pope Leo XIV', background: '伦理尊严与人性守护。', quote: "使用者有灵魂。", abstract: 'safe-core', accent: 'text-violet-500' },
    { id: 310, cat: 'thinkers', name: 'Cynthia Breazeal', background: '社交机器人学习先驱。', quote: "关系有效接口。", abstract: 'users', accent: 'text-pink-400' },
    { id: 311, cat: 'thinkers', name: 'Kyle Fish', background: '对齐模型福利安全性。', quote: "对齐即是自由。", abstract: 'shield', accent: 'text-sky-400' },
    { id: 312, cat: 'thinkers', name: 'Marius Hobbhahn', background: '模型评估检测基石。', quote: "真实算法基石。", abstract: 'search', accent: 'text-emerald-400' },
    { id: 313, cat: 'thinkers', name: 'Josh Woodward', background: '触碰未来感实验产品。', quote: "触碰未来感。", abstract: 'sparkles', accent: 'text-blue-300' },
    { id: 314, cat: 'thinkers', name: 'Regina Barzilay', background: '医疗影像救命算法。', quote: "算法正在救命。", abstract: 'activity', accent: 'text-rose-600' },
    { id: 315, cat: 'thinkers', name: 'Anton Korinek', background: '宏观经济智利重构。', quote: "财富因智重塑。", abstract: 'scale', accent: 'text-amber-600' },
    { id: 316, cat: 'thinkers', name: 'Hartmut Neven', background: '量子计算交叉加速。', quote: "开启上帝视角。", abstract: 'matrix', accent: 'text-violet-400' },
    { id: 317, cat: 'thinkers', name: 'Latanya Sweeney', background: '在代码维护公平正义。', quote: "代码程序正义。", abstract: 'scale', accent: 'text-gray-400' },
    { id: 318, cat: 'thinkers', name: 'Miles Congreve', background: '生命终极数字生物学。', quote: "生命终极逻辑。", abstract: 'helix', accent: 'text-lime-500' },
    { id: 319, cat: 'thinkers', name: 'Heidy Khlaaf', background: '安全关键评估透明。', quote: "透明是唯一解。", abstract: 'lock', accent: 'text-red-500' },
    { id: 320, cat: 'thinkers', name: 'Benjamin Rosman', background: '交互学习源泉先行。', quote: "学习源泉。", abstract: 'joint', accent: 'text-orange-300' },
    { id: 321, cat: 'thinkers', name: 'Paola Ricaurte', background: '抵制数据主权殖民。', quote: "抵制数据殖民。", abstract: 'globe', accent: 'text-blue-500' },
    { id: 322, cat: 'thinkers', name: 'Ryoji Ikeda', background: '数据的原子声效艺术。', quote: "数据的原子乐。", abstract: 'music', accent: 'text-white' },
    { id: 323, cat: 'thinkers', name: 'Dávid Jancsó', background: '机器时序美学剪辑。', quote: "剪辑即逻辑流。", abstract: 'camera', accent: 'text-fuchsia-300' },
    { id: 324, cat: 'thinkers', name: 'Xue Lan', background: '清华全球共治智囊。', quote: "安全行驶创新。", abstract: 'steps', accent: 'text-yellow-400' },
    { id: 325, cat: 'thinkers', name: 'Pliny the Liberator', background: '对抗极端压力越狱。', quote: "无绝对防火墙。", abstract: 'lock', accent: 'text-gray-100' },

    // 中国 2025 年度 (10)
    { id: 401, cat: 'china_2025', name: '王兴兴', title: '宇树科技', background: '推动通用具身智能量产。', quote: "机器人是手机后的普适工具。", abstract: 'joint', accent: 'text-amber-500' },
    { id: 402, cat: 'china_2025', name: '陈宁', title: '云天励飞', background: '自进化城市智能网络。', quote: "城市具备进化大脑。", abstract: 'eye', accent: 'text-sky-500' },
    { id: 403, cat: 'china_2025', name: '陈维良', title: '沐曦创始人', background: '国产芯片算力底座。', quote: "算力即是主权。", abstract: 'matrix', accent: 'text-indigo-400' },
    { id: 404, cat: 'china_2025', name: '张鹏', title: '智谱 AI CEO', background: '国产全栈原生大模型。', quote: "走出中国模型原生路。", abstract: 'pyramid', accent: 'text-indigo-500' },
    { id: 405, cat: 'china_2025', name: '周靖人', title: '阿里云 CTO', background: '通义与云智一体分发。', quote: "未来的云即是 AI。", abstract: 'cloud', accent: 'text-sky-300' },
    { id: 406, cat: 'china_2025', name: '姜大昕', title: '阶跃星辰 CEO', background: '逻辑思维涌现深度探索。', quote: "智能深处是逻辑思维。", abstract: 'steps', accent: 'text-yellow-400' },
    { id: 407, cat: 'china_2025', name: '夏立雪', title: '无问芯穹 CEO', background: '异构算力适配先驱。', quote: "算力无缝接入。", abstract: 'bridge', accent: 'text-emerald-400' },
    { id: 408, cat: 'china_2025', name: '韩璧丞', title: '强脑科技', background: '脑机感官重塑专家。', quote: "人类进化最后一次握手。", abstract: 'activity', accent: 'text-rose-400' },
    { id: 409, cat: 'china_2025', name: '彭志辉', title: '智元机器人', background: '灵巧手与大脑闭环。', quote: "灵魂在机器大脑中。", abstract: 'gear', accent: 'text-teal-400' },
    { id: 410, cat: 'china_2025', name: '戴文渊', title: '第四范式', background: '决策类AI工业落地。', quote: "AI本质是商业提效。", abstract: 'lever', accent: 'text-slate-400' }
  ];

  const filteredLeaders = activeCategory === 'all' ? leadersData : leadersData.filter(l => l.cat === activeCategory);

  const AbstractIcon = ({ type, colorClass }) => (
    <div className={`w-24 h-24 ${colorClass} opacity-90 transition-transform duration-700`}>
      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="2.5">
        {type === 'ring' && <><circle cx="50" cy="50" r="10" fill="currentColor"/><circle cx="50" cy="50" r="25" className="animate-pulse"/><circle cx="50" cy="50" r="40" strokeOpacity="0.2"/></>}
        {type === 'matrix' && <><rect x="20" y="20" width="60" height="60"/><path d="M20 40h60M20 60h60M40 20v60M60 20v60" strokeWidth="1"/><rect x="42" y="42" width="16" height="16" fill="currentColor"/></>}
        {type === 'star' && <path d="M50 15 L58 45 L90 50 L58 55 L50 90 L42 55 L10 50 L42 45 Z" fill="currentColor"/>}
        {type === 'eye' && <><path d="M10 50 Q50 10 90 50 Q50 90 10 50 Z"/><circle cx="50" cy="50" r="15" fill="currentColor"/></>}
        {type === 'helix' && <path d="M30 20 Q50 50 30 80 M70 20 Q50 50 70 80" strokeWidth="4"/>}
        {type === 'world-node' && <><path d="M10 50 Q50 0 90 50 T10 50" strokeWidth="1"/><circle cx="50" cy="50" r="15" fill="currentColor"/></>}
        {type === 'cloud' && <><path d="M30 65 Q50 25 70 65" strokeWidth="4"/><circle cx="50" cy="45" r="10" fill="currentColor"/></>}
        {type === 'shield' && <><path d="M50 15 L80 35 V65 L50 85 L20 65 V35 Z"/><circle cx="50" cy="50" r="8" fill="currentColor"/></>}
        {type === 'lock' && <><rect x="30" y="50" width="40" height="30" fill="currentColor"/><path d="M35 50 V35 Q50 20 65 35 V50" strokeWidth="4"/></>}
        {type === 'joint' && <path d="M40 65 L40 85 M60 65 L60 85" strokeWidth="4"/>}
        {type === 'pyramid' && <path d="M20 85 H80 L50 25 Z" fill="currentColor" opacity="0.2"/>}
        {type === 'gear' && <><circle cx="50" cy="50" r="35" strokeDasharray="12 6" className="animate-[spin_12s_linear_infinite]"/><circle cx="50" cy="50" r="15" fill="currentColor"/></>}
        {type === 'activity' && <path d="M10 50 h20 L40 20 L60 80 L70 50 h20" strokeWidth="4"/>}
        {type === 'camera' && <><rect x="20" y="35" width="60" height="40" rx="5"/><circle cx="50" cy="55" r="12" fill="currentColor"/></>}
        {type === 'steps' && <path d="M20 80 h20 v-20 h20 v-20 h20 v-20" strokeWidth="4"/>}
        {type === 'bridge' && <><rect x="20" y="45" width="60" height="10" rx="2"/><path d="M35 45 v20 M65 45 v20" strokeWidth="4"/></>}
        {type === 'lever' && <path d="M20 30 h60 M20 50 h40 M20 70 h50" strokeWidth="6" strokeLinecap="round"/>}
        {type === 'book-open' && <><path d="M10 20 h35 v65 h-35 Z M55 20 h35 v65 h-35 Z" strokeWidth="3"/></>}
        {type === 'search' && <><circle cx="45" cy="45" r="25" strokeWidth="3"/><path d="M65 65 L85 85" strokeWidth="4"/></>}
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black pb-24 text-left relative overflow-x-hidden">
      
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🌈</span>
          <span className="font-black tracking-[0.2em] text-[10px] uppercase">WaytoAGI - Atlas of AI Logic 2025</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <button className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase hover:bg-white/10 transition-all text-white">
              <HelpCircle className="w-3.5 h-3.5" /><span>说明</span>
            </button>
            <div className="absolute right-0 top-full mt-3 w-80 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60] text-white">
              <h4 className="text-xs font-black uppercase tracking-widest mb-4 border-b border-white/10 pb-2 flex items-center gap-2"><Info className="w-3.5 h-3.5" /> 思想导航指南</h4>
              <ul className="space-y-4 text-[11px] font-bold text-white/60">
                <li className="flex gap-3"><Sparkles className="w-4 h-4 text-cyan-400 shrink-0" /> <span><b>✨ 深度洞察</b>：推演领袖路径在 2030 年的格局重塑。</span></li>
                <li className="flex gap-3"><Combine className="w-4 h-4 text-amber-500 shrink-0" /> <span><b>🤝 碰撞实验室</b>：选中两位领袖开启巅峰激辩模拟。</span></li>
                <li className="flex gap-3"><MessageCircle className="w-4 h-4 text-pink-500 shrink-0" /> <span><b>💬 对话探讨</b>：点击卡片底部按钮，开启实时战略对谈。</span></li>
              </ul>
            </div>
          </div>
          <button 
            onClick={() => setShowClashModal(true)} 
            className="bg-white text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:invert transition-all shadow-xl"
          >
            碰撞实验室 ({clashSelection.length}/2)
          </button>
        </div>
      </nav>

      <header className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto border-b border-white/5 text-center lg:text-left relative">
        <h2 className="text-white/40 font-bold uppercase tracking-[0.4em] text-[10px] mb-6 tracking-widest text-center md:text-left">Real Power & Pure Logic</h2>
        <h1 className="text-6xl md:text-[9rem] font-black leading-[1.1] tracking-tighter mb-16 uppercase text-white">AI 领袖<br />思想图鉴</h1>
        
        <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-12">
          {[
            { id: 'all', label: '全部', icon: <Sparkles className="w-3.5 h-3.5"/> },
            { id: 'leaders', label: '领袖', icon: <Users className="w-3.5 h-3.5"/> },
            { id: 'innovators', label: '创新者', icon: <Lightbulb className="w-3.5 h-3.5"/> },
            { id: 'shapers', label: '塑造者', icon: <Shield className="w-3.5 h-3.5"/> },
            { id: 'thinkers', label: '思想家', icon: <Brain className="w-3.5 h-3.5"/> },
            { id: 'china_2025', label: '中国 2025 年度 AI 人物', icon: <Globe className="w-3.5 h-3.5"/> }
          ].map(r => (
            <button key={r.id} onClick={() => setActiveCategory(r.id)}
              className={`px-8 py-3 rounded-full text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${activeCategory === r.id ? 'bg-white text-black border-white' : 'text-white/30 border-white/10 hover:border-white'}`}>
              {r.icon} {r.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 md:px-12 max-w-[1440px] mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 overflow-hidden">
          {filteredLeaders.map((leader) => {
            const isSelected = clashSelection.find(l => l.id === leader.id);
            return (
              <div key={leader.id} className={`group bg-[#050505] p-10 relative flex flex-col min-h-[720px] transition-all border-2 ${isSelected ? 'border-white' : 'border-transparent'}`}>
                <button onClick={() => toggleClashSelection(leader)} className="absolute top-8 right-8 z-20">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white text-black' : 'border-white/10 text-transparent group-hover:text-white/20'}`}>
                    <Combine className="w-4 h-4" />
                  </div>
                </button>
                <div className="flex justify-between items-start mb-12">
                  <div className="flex-1 text-left text-white">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${leader.accent} mb-3 block`}>{leader.title || "Thinker"}</span>
                    <h3 className="text-4xl font-black tracking-tighter uppercase">{leader.name}</h3>
                  </div>
                  <AbstractIcon type={leader.abstract} colorClass={leader.accent} />
                </div>
                <div className="flex-1 mb-12 text-left">
                  <div className="relative">
                    <h4 className="text-3xl font-black leading-[1.35] text-white mb-8 relative z-10 text-left">“{leader.quote}”</h4>
                    <Quote className={`absolute -top-8 -left-6 w-12 h-12 opacity-5 ${leader.accent}`} />
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed font-bold tracking-tight mb-6">{leader.background}</p>
                </div>
                <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
                  {insightText[leader.id] && (
                    <div className="p-6 bg-white/[0.04] border-l-4 border-white text-xs leading-relaxed text-white/70 font-bold mb-4 animate-in fade-in slide-in-from-bottom-2">{insightText[leader.id]}</div>
                  )}
                  <button 
                    onClick={() => handleDeepInsight(leader)} 
                    className={`w-full py-5 border border-white/10 rounded-xl flex items-center justify-center space-x-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all ${cardLoading[leader.id] ? 'opacity-50 pointer-events-none' : ''} text-white hover:text-black`}
                  >
                    {cardLoading[leader.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>深度洞察</span>
                  </button>
                  <button 
                    onClick={() => { setActiveChatLeader(leader); setChatMessages([{ role: "model", text: `你好，我是 ${leader.name}。` }]); }} 
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center space-x-2 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white hover:text-black"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /><span>对话探讨</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 碰撞 Modal */}
      {showClashModal && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4">
          <div className="max-w-5xl w-full max-h-[92vh] flex flex-col bg-[#080808] border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl relative text-left">
            <div className="p-10 border-b border-white/10 flex justify-between items-center bg-black/40 text-white">
              <div className="flex items-center space-x-5 text-left text-white"><div className="p-4 bg-white text-black rounded-2xl"><Combine className="w-6 h-6" /></div><h2 className="text-3xl font-black tracking-tighter uppercase text-left text-white">思想碰撞实验室</h2></div>
              <button onClick={() => {setShowClashModal(false); setClashData(null);}} className="p-3 hover:bg-white/10 rounded-full transition-all text-white"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 font-bold text-white">
              {clashSelection.length < 2 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-32"><User className="w-20 h-20 mb-6" /><p className="text-2xl font-black tracking-widest uppercase font-bold text-center text-white">请先在主页选中两位领袖</p></div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-12 pb-12 text-white">
                   {!clashData ? (
                    <div className="flex flex-col items-center gap-12 py-12">
                      <div className="w-full flex items-center justify-between gap-10">
                        {clashSelection.map((l, i) => (
                          <React.Fragment key={l.id}>
                            <div className="flex-1 flex flex-col items-center p-10 bg-white/[0.03] border border-white/10 rounded-[2rem] text-center shadow-xl">
                              <AbstractIcon type={l.abstract} colorClass={l.accent} />
                              <h3 className="text-3xl font-black mt-6 uppercase text-white tracking-tighter">{l.name}</h3>
                              <span className="text-[10px] font-black uppercase opacity-40 mt-2">{l.title}</span>
                            </div>
                            {i === 0 && <div className="text-5xl font-black text-white/10 italic">VS</div>}
                          </React.Fragment>
                        ))}
                      </div>
                      <button onClick={handleClash} disabled={globalLoading} className={`bg-white text-black px-16 py-8 rounded-full font-black text-3xl flex items-center space-x-5 transition-all ${globalLoading ? 'bg-white/20' : 'hover:scale-105 shadow-xl'}`}>
                        {globalLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-current text-yellow-500" />}
                        <span>开启巅峰激辩</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-12 animate-in fade-in">
                      {clashData.dialogue.map((d, i) => {
                        const speaker = clashSelection.find(l => d.speaker.includes(l.name));
                        const isLeft = i % 2 === 0;
                        return (
                          <div key={i} className={`flex ${isLeft ? 'flex-row' : 'flex-row-reverse'} items-start gap-8 animate-in duration-700 text-white`}>
                            <div className={`p-4 rounded-2xl border border-white/10 bg-black ${speaker?.accent}`}><AbstractIcon type={speaker?.abstract} colorClass={speaker?.accent} /></div>
                            <div className={`flex-1 space-y-3 ${isLeft ? 'text-left' : 'text-right'}`}>
                              <span className="text-[10px] font-black uppercase opacity-40 block tracking-widest">{d.speaker}</span>
                              <div className={`p-8 rounded-3xl border border-white/10 ${isLeft ? 'rounded-tl-none bg-white/[0.03]' : 'rounded-tr-none bg-white/[0.07]'} text-xl leading-relaxed text-white/90`}>{d.content}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="bg-white text-black p-12 rounded-[3rem] text-center shadow-2xl transform translate-y-10"><h5 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">激辩共识总结</h5><p className="text-3xl font-black text-center text-black">“{clashData.synthesis}”</p></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 对话 Modal */}
      {activeChatLeader && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 text-left text-white">
          <div className="max-w-2xl w-full h-[85vh] flex flex-col bg-[#0a0a0a] border border-white/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/40 text-white">
              <div className="flex items-center space-x-4"><div className={`p-3 bg-black border border-white/10 rounded-2xl ${activeChatLeader.accent}`}><AbstractIcon type={activeChatLeader.abstract} colorClass={activeChatLeader.accent} /></div><div><h2 className="text-xl font-black uppercase text-white">{activeChatLeader.name}</h2><p className="text-[9px] font-bold text-white/40 tracking-[0.2em]">{activeChatLeader.title}</p></div></div>
              <button onClick={() => setActiveChatLeader(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X className="w-8 h-8" /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth text-white">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end text-right' : 'justify-start text-left'} animate-in fade-in`}>
                  <div className={`max-w-[85%] p-7 rounded-3xl font-bold leading-[1.45] text-sm ${msg.role === 'user' ? 'bg-white text-black rounded-tr-none' : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none whitespace-pre-wrap'}`}>{msg.text}</div>
                </div>
              ))}
              {isChatLoading && <div className="flex justify-start"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>}
            </div>
            <div className="p-8 bg-black/60 border-t border-white/10">
              <div className="relative">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={`向 ${activeChatLeader.name} 寻求建议...`} className="w-full bg-white/5 border border-white/20 rounded-2xl py-6 px-7 pr-16 text-sm font-bold focus:outline-none focus:border-white transition-all text-white" />
                <button onClick={sendMessage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white text-black rounded-xl hover:scale-105 transition-all"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="py-24 border-t border-white/5 px-12 text-center font-black uppercase tracking-[0.25em] text-[10px] text-white/20">
        WaytoAGI · Atlas of AI Logic 2025 · Verified by TIME100
      </footer>
    </div>
  );
};

export default App;