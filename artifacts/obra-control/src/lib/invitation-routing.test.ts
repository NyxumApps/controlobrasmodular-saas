import assert from 'node:assert/strict';
import test from 'node:test';
import {
  invitationPath,
  invitationReturnUrl,
  invitationSignInPath,
  invitationSuccessPath,
} from './invitation-routing';

test('new users return from sign-up to the original invitation', () => {
  assert.equal(
    invitationReturnUrl('https://obra.example', '', 'token-123', '?__clerk_ticket=ticket'),
    'https://obra.example/invite/token-123?__clerk_ticket=ticket',
  );
  assert.equal(
    invitationSignInPath('', 'token-123', '?__clerk_ticket=ticket'),
    '/invite/token-123/sign-in?__clerk_ticket=ticket',
  );
});

test('existing users return from sign-in to the original invitation', () => {
  assert.equal(
    invitationReturnUrl('https://obra.example', '/obra', 'token-123', '?__clerk_ticket=ticket'),
    'https://obra.example/obra/invite/token-123?__clerk_ticket=ticket',
  );
  assert.equal(
    invitationPath('/obra', 'token-123', '?__clerk_ticket=ticket'),
    '/obra/invite/token-123?__clerk_ticket=ticket',
  );
});

test('invitation tokens are encoded when placed in URLs', () => {
  assert.equal(invitationPath('', 'token/with spaces'), '/invite/token%2Fwith%20spaces');
});

test('successful acceptance reaches the company dashboard', () => {
  assert.equal(invitationSuccessPath, '/dashboard');
});