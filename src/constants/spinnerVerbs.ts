// 生成过程中的状态词,用柜体车间的行话,让等待不那么干等。
export const SPINNER_VERBS = [
  '量尺',
  '排柜',
  '算板件',
  '开料',
  '划线',
  '打孔',
  '封边',
  '试装',
  '选五金',
  '配铰链',
  '装滑轨',
  '裁背板',
  '立侧板',
  '放层板',
  '装门板',
  '调门缝',
  '安拉手',
  '校垂直',
  '除灰尘',
  '打蜡',
  '构思',
  '画草图',
  '算用料',
  '对图纸',
  '琢磨',
];

export function pickSpinnerVerb(): string {
  return SPINNER_VERBS[Math.floor(Math.random() * SPINNER_VERBS.length)];
}
