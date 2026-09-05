import test from'node:test';import assert from'node:assert/strict';import{scoreVotes}from'../src/game.ts';import{QUESTIONS,shuffle}from'../src/questions.ts';
test('database includes 30 CS2 pairs',()=>assert.equal(QUESTIONS.filter(q=>q.category==='CS2').length,30));
test('question IDs are unique and pairs differ',()=>{assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,QUESTIONS.length);assert.ok(QUESTIONS.every(q=>q.questionA!==q.questionB))});
test('shuffle preserves every item',()=>assert.deepEqual([...shuffle([1,2,3])].sort(),[1,2,3]));
test('correct voters score and an escaping impostor gets two points',()=>{const players=[{id:'a',score:0},{id:'b',score:0},{id:'c',score:0}];const scores=scoreVotes(players,'c',{a:'c',b:'a',c:'a'});assert.deepEqual(scores.map(player=>player.score),[1,0,2])});
test('an impostor selected by a majority gets no escape points',()=>{const players=[{id:'a',score:0},{id:'b',score:0},{id:'c',score:0}];const scores=scoreVotes(players,'c',{a:'c',b:'c',c:'a'});assert.deepEqual(scores.map(player=>player.score),[1,1,0])});
