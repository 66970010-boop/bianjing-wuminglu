/* Shared deterministic rules. Every array reads from the first (bottom) line upwards. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.BJFortune = factory(root.BJ_HEXAGRAMS);
})(globalThis, function (data) {
  const byBits = new Map(data.map(h => [h.bits, h]));
  function cast(lines) {
    if (!Array.isArray(lines) || lines.length !== 6 || lines.some(n => ![6,7,8,9].includes(n))) throw new Error('六爻数据无效');
    const base = byBits.get(lines.map(n => n % 2).join(''));
    const changed = byBits.get(lines.map(n => n === 6 ? 1 : n === 9 ? 0 : n % 2).join(''));
    const moving = lines.flatMap((n,i) => n === 6 || n === 9 ? [i+1] : []);
    return { base, changed, moving, lines: lines.slice() };
  }
  function coin(randomBit) { return [0,0,0].map(() => randomBit() ? 3 : 2); }
  function describe(result) {
    return result.moving.length ? '第 '+result.moving.join('、')+' 爻动，之卦为「'+result.changed.name+'」。' : '六爻皆静，本卦与之卦相同。';
  }
  const images={乾:'刚健进取，也须知所止',坤:'承载与配合，先安顿眼前之事',震:'事情初动，先定心再行动',巽:'循序而入，耐心沟通',坎:'遇险须慎，先辨清难处',離:'明辨所依，照见眼前的事实',艮:'知止有节，留出思量的余地',兌:'坦诚交谈，也要留心言语的分寸'};
  function offline(result,question,followup=false) {
    const ask=/寻|老人|名字|姓名/.test(question)?'寻名一事，仍要去问与老人相识的人；卦不能替人记起往事。':/去|行|留|远/.test(question)?'去留之间，可先盘点路费、归期与牵挂，再作打算。':/学|考|功名/.test(question)?'眼前可做的，是把功课与准备落到实处，再向有经验的人请教。':/钱|买卖|生意|工作/.test(question)?'先看手中本钱、所需工夫与能承受的损失，再决定下一步。':'不妨先写下最在意的事，问清可知的部分，再走一小步。';
    return (followup?'再论此问，仍以这一卦为参照。':'客官得「'+result.base.name+'」，上'+result.base.upper+'下'+result.base.lower+'。')+'以卦象作比：'+images[result.base.lower]+'；'+images[result.base.upper]+'。'+describe(result)+ask+'这只是借象思量，事情如何，终须由人去做。';
  }
  return {cast,coin,describe,offline};
});
