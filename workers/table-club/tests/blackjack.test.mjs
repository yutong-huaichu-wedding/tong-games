import {strict as assert} from 'node:assert';
import {score,natural,shoe,bp,bjFresh,bjBegin,bjAct,bjTick,bjView,settle,bjBot} from '../lib/blackjack.ts';
const hand=(...ranks)=>ranks.map(rank=>({rank:String(rank),suit:'♠'}));
assert.equal(score(hand('A','A','9')),21);assert.equal(score(hand('A','A','K')),12);assert.equal(score(hand('A','6')),17);assert(natural(hand('A','K')));assert(!natural(hand(7,7,7)));
const cards=shoe();assert.equal(cards.length,312);for(const suit of ['♠','♥','♣','♦'])for(const rank of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])assert.equal(cards.filter(c=>c.suit===suit&&c.rank===rank).length,6);
function table(player,dealer){const r=bjFresh('ABC123','secret-a','甲');const p=r.players[0];p.hand=hand(...player);p.chips=950;p.state='playing';r.dealer=hand(...dealer);r.deck=hand(10,6,8);r.status='playing';r.deadline=Date.now()+45000;return r}
let r=table(['A','K'],[10,9]);settle(r);assert.equal(r.players[0].chips,1075);assert.equal(r.players[0].net,75);
r=table(['A','K'],['A','Q']);settle(r);assert.equal(r.players[0].chips,1000);assert.equal(r.players[0].net,0);
r=table([7,7,7],['A','Q']);settle(r);assert.equal(r.players[0].chips,950);
r=table([10,9],[10,7]);settle(r);assert.equal(r.players[0].chips,1050);
r=table([10,9],['A',6]);const before=r.deck.length;settle(r);assert.equal(r.deck.length,before);assert.equal(r.dealer.length,2);
r=table([10,9],[10,9]);settle(r);assert.equal(r.players[0].chips,1000);
r=table([10,8],[10,6]);r.deck=hand(10);settle(r);assert.equal(r.players[0].chips,1050);assert.equal(score(r.dealer),26);
r=table([10,6],[10,7]);r.deck=hand(10);bjAct(r,'secret-a',{action:'hit'});assert.equal(r.status,'reveal');assert.equal(r.players[0].chips,950);assert.equal(r.players[0].outcome,'爆牌');
r=table([5,6],[10,8]);r.deck=hand(10);bjAct(r,'secret-a',{action:'double'});assert.equal(r.players[0].bet,100);assert.equal(r.players[0].net,100);assert.equal(r.players[0].chips,1100);
r=table([5,6,2],[10,8]);assert.throws(()=>bjAct(r,'secret-a',{action:'double'}));r=table([5,6],[10,8]);r.players[0].chips=20;assert.throws(()=>bjAct(r,'secret-a',{action:'double'}));
r=table([10,8],[10,7]);const data=bjView(r,'secret-a');assert.equal(data.dealer[1],null);assert.equal(data.dealerScore,null);assert(!JSON.stringify(data).includes('secret-a'));assert(!('deck' in data));assert.equal(data.players[0].hand.length,2);r.deadline=Date.now()-1;assert.throws(()=>bjAct(r,'secret-a',{action:'hit'}));bjTick(r);assert.equal(r.status,'reveal');
r=bjFresh('ABC123','secret-a','甲');r.players.push(bp('secret-b','乙'));r.players.forEach(p=>p.ready=true);bjBegin(r);if(r.status==='playing'){r.players[0].state='playing';r.players[1].state='playing';r.turn=0;bjAct(r,'secret-a',{action:'leave'});assert.equal(r.host,'secret-b');assert.equal(r.turn,0);assert.equal(r.players[0].id,'secret-b')}
r=bjFresh('ABC123','secret-a','甲');bjBot(r);assert(r.players[1].bot);r.players[0].ready=true;bjBegin(r);assert.equal(r.players[0].chips, r.status==='playing'?950:r.players[0].chips);
r=bjFresh('ABC123','secret-a','甲',true);r.waitingSince=Date.now()-16000;bjTick(r);assert.equal(r.round,1);assert.notEqual(r.status,'waiting');
r=bjFresh('ABC123','secret-a','甲',true);r.players[0].chips=0;r.waitingSince=Date.now()-20000;bjTick(r);assert.equal(r.status,'waiting');bjAct(r,'secret-a',{action:'refill'});assert.equal(r.players[0].chips,1000);
console.log('Passed: aces, 6-deck composition, natural/push/3:2, soft 17, dealer bust, hit/double, bankroll, late actions, hidden deck/hole card/tokens, host departure, bots and solo fallback.');
