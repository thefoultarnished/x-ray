// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
let readJson;
let findAndSendLocation;
let isAboutAnswer;

beforeAll(() => {
  ({ readJson, findAndSendLocation, isAboutAnswer } = require('../src/parser.js'));
});

// A stand-in for a finished request.
const answer = (responseType, responseText) => ({ responseType, responseText });

// A request whose text cannot be read, as for files and other non-text answers.
const unreadable = (responseType) => ({
  responseType,
  get responseText() {
    throw new DOMException(
      "The value is only accessible if the object's 'responseType' is '' or 'text'.",
      'InvalidStateError'
    );
  },
});

describe('readJson', () => {
  it('reads a JSON object or list from a text answer', () => {
    expect(readJson(answer('', '{"a":1}'))).toEqual({ a: 1 });
    expect(readJson(answer('text', '{"a":1}'))).toEqual({ a: 1 });
    expect(readJson(answer('', '[1,2]'))).toEqual([1, 2]);
  });

  it('skips files and other answers that are not text, without an error', () => {
    for (const type of ['blob', 'arraybuffer', 'document', 'json']) {
      expect(() => readJson(unreadable(type))).not.toThrow();
      expect(readJson(unreadable(type))).toBeNull();
    }
  });

  it('skips a text answer that is not JSON', () => {
    expect(readJson(answer('', '<html></html>'))).toBeNull();
    expect(readJson(answer('', 'plain words'))).toBeNull();
  });

  it('skips empty, missing and broken answers', () => {
    expect(readJson(answer('', ''))).toBeNull();
    expect(readJson(answer('', null))).toBeNull();
    expect(readJson(answer('', undefined))).toBeNull();
    expect(readJson(answer('', '{oops'))).toBeNull();
  });

  it('survives a text answer whose text cannot be read', () => {
    expect(() => readJson(unreadable(''))).not.toThrow();
    expect(readJson(unreadable(''))).toBeNull();
  });
});

describe('findAndSendLocation', () => {
  const received = [];
  const listener = (event) => received.push(event.data);

  beforeAll(() => window.addEventListener('message', listener));
  afterEach(() => (received.length = 0));

  const settle = () => new Promise((r) => setTimeout(r, 10));

  it("sends the location, app and account name found in X's answer", async () => {
    findAndSendLocation({
      data: {
        user: { core: { screen_name: 'someone' }, about_profile: { account_based_in: 'Peru', source: 'Web App' } },
      },
    });
    await settle();
    expect(received).toEqual([{ type: 'X_LOCATION_FOUND', handle: 'someone', location: 'Peru', source: 'Web App' }]);
  });

  it('finds the account name in the other place X puts it', async () => {
    findAndSendLocation({ screen_name: 'other', about_profile: { account_based_in: 'Chile' } });
    await settle();
    expect(received).toMatchObject([{ handle: 'other', location: 'Chile' }]);
  });

  it('sends an app name even when there is no location', async () => {
    findAndSendLocation({ core: { screen_name: 'appy' }, about_profile: { source: 'iOS' } });
    await settle();
    expect(received).toMatchObject([{ handle: 'appy', location: undefined, source: 'iOS' }]);
  });

  it('sends nothing when the answer has no location or app', async () => {
    findAndSendLocation({ about_profile: {} });
    findAndSendLocation({ about_profile: { account_based_in: '', source: '' } });
    findAndSendLocation({ other: [1, 2, { nested: true }] });
    await settle();
    expect(received).toEqual([]);
  });

  it('ignores values that are not objects', async () => {
    for (const value of [null, undefined, 5, 'text', true]) {
      expect(() => findAndSendLocation(value)).not.toThrow();
    }
    await settle();
    expect(received).toEqual([]);
  });

  it('looks inside lists and keeps searching until it finds the profile', async () => {
    findAndSendLocation([{ unrelated: 1 }, [{ screen_name: 'deep', about_profile: { account_based_in: 'Kenya' } }]]);
    await settle();
    expect(received).toMatchObject([{ handle: 'deep', location: 'Kenya' }]);
  });

  // What X sends for an account that hides its About details.
  const hiddenAnswer = (handle = 'quiet') => ({
    data: {
      result: {
        about_profile: { learn_more_url: 'https://help.example/verified', location_accurate: true },
        core: { screen_name: handle },
      },
    },
  });

  it('says the account is hidden when the About answer holds no location or app', async () => {
    findAndSendLocation(hiddenAnswer(), true);
    await settle();
    expect(received).toEqual([
      { type: 'X_LOCATION_FOUND', handle: 'quiet', location: undefined, source: undefined, hidden: true },
    ]);
  });

  it('does not call an account hidden from an answer that is not the About answer', async () => {
    findAndSendLocation(hiddenAnswer());
    findAndSendLocation(hiddenAnswer(), false);
    await settle();
    expect(received).toEqual([]);
  });

  it('does not call an account hidden when the About answer has a location or an app', async () => {
    findAndSendLocation({ core: { screen_name: 'a' }, about_profile: { account_based_in: 'Peru' } }, true);
    findAndSendLocation({ core: { screen_name: 'b' }, about_profile: { source: 'iOS' } }, true);
    await settle();
    expect(received).toHaveLength(2);
    expect(received.some((message) => message.hidden)).toBe(false);
  });

  it('says nothing when the About answer has no profile at all', async () => {
    findAndSendLocation({ data: { user: { core: { screen_name: 'gone' } } } }, true);
    findAndSendLocation({ errors: [{ code: 88 }] }, true);
    await settle();
    expect(received).toEqual([]);
  });
});

describe('isAboutAnswer', () => {
  it('is true only for the About answer, with or without a query string', () => {
    expect(isAboutAnswer('https://x.com/i/api/graphql/abc123/AboutAccountQuery')).toBe(true);
    expect(isAboutAnswer('https://x.com/i/api/graphql/abc123/AboutAccountQuery?variables=%7B%7D')).toBe(true);
  });

  it('is false for other answers, odd names and missing addresses', () => {
    for (const url of [
      'https://x.com/i/api/graphql/abc123/UserByScreenName',
      'https://x.com/i/api/graphql/abc123/AboutAccountQueryExtra',
      'https://x.com/AboutAccountQuery/other',
      '',
      undefined,
      null,
    ]) {
      expect(isAboutAnswer(url)).toBe(false);
    }
  });
});
