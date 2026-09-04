import test from'node:test';import assert from'node:assert/strict';import{QUESTIONS,shuffle}from'../src/questions.ts';
test('database includes 30 CS2 pairs',()=>assert.equal(QUESTIONS.filter(q=>q.category==='CS2').length,30));
test('question IDs are unique and pairs differ',()=>{assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,QUESTIONS.length);assert.ok(QUESTIONS.every(q=>q.questionA!==q.questionB))});
test('shuffle preserves every item',()=>assert.deepEqual([...shuffle([1,2,3])].sort(),[1,2,3]));
