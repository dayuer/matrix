import type { PartnerData, SupportCard, Manager } from '../types';

/**
 * 城市加盟页数据。
 * support[].icon 为 SVG 内部元素（外层 <svg> 由模板统一包裹）。
 */

const support: SupportCard[] = [
  { title: '产品技术支持', desc: '提供统一的技术平台接入，包括移动 APP、微信小程序、400 热线后台等全渠道产品更新与终身维护。',
    icon: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>' },
  { title: '客户服务保障', desc: '提供灵活的本地化价格定价体系、客服资源对接，支持加盟商的业务咨询、投诉纠纷处理及司机支持。',
    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' },
  { title: '专业培训体系', desc: '系统性的平台操作培训、高标准的司机代驾服务规范流程，以及区域团队精细化管理与运营指导。',
    icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>' },
  { title: '多维运营数据分析', desc: '为加盟商提供授权合作区域内业务运营所需的核心数据支持，帮助精准画像、掌握市场动态并科学决策。',
    icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>' },
  { title: '推广物料模板', desc: '按照 e代驾全国统一的 VI/SI 视觉标准，支持并提供丰富的宣传物料、线下地推设计模板及拓展物料指导。',
    icon: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>' },
  { title: '市场推广支持', desc: '全面指导加盟区域线上裂变、社群营销，以及线下餐饮酒类渠道异业合作，多维扩充获客漏斗。',
    icon: '<path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>' },
  { title: '高效派单系统', desc: '基于强大的智能调度引擎和就近分发派单机制，将产生的代驾订单秒级无缝派送给区域内的优质代驾司机。',
    icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>' },
  { title: '平台流量共享', desc: '享有 e代驾全国性的平台流量倾斜、以及微信/美团等生态渠道共享资源，直接承接集团企业大客户协议订单。',
    icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>' },
];

const managers: Manager[] = [
  { avatar: '金', name: '金经理', title: '区域加盟合作负责人', phone: '18001105191', wechat: '18001105191', email: 'jinhu@edaijia-inc.cn',
    regions: '山东 · 江苏 · 浙江 · 四川' },
  { avatar: '杨', name: '杨经理', title: '区域加盟合作负责人', phone: '13718981121', wechat: '13718981121', email: 'yangfan@edaijia-inc.cn',
    regions: '河南 · 广东 · 河北 · 贵州 · 云南 · 山西 · 陕西 · 内蒙古 · 广西 · 海南' },
  { avatar: '余', name: '余经理', title: '区域加盟合作负责人', phone: '18155781581', wechat: '18155781581', email: 'yufeng@edaijia-inc.cn',
    regions: '安徽 · 湖南 · 江西 · 辽宁 · 湖北 · 福建 · 黑龙江 · 吉林' },
  { avatar: '朱', name: '朱经理', title: '区域加盟合作负责人', phone: '18911981290', wechat: '18911981290', email: 'zhufeng@edaijia-inc.cn',
    regions: '新疆 · 西藏 · 甘肃 · 青海 · 宁夏' },
];

const partner: PartnerData = { support, managers };

export default partner;
