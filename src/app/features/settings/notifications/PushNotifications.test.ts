import { afterEach, describe, expect, it, vi } from 'vitest';

const isTauri = vi.hoisted(() => vi.fn<() => boolean>());

vi.mock('@tauri-apps/api/core', () => ({ isTauri }));

import {
  enablePushNotifications,
  disablePushNotifications,
  togglePusher,
} from './PushNotifications';

const matrixClient = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string>(() => 'token'),
}));
const clientConfig = {} as never;

afterEach(() => {
  vi.clearAllMocks();
});

describe('enablePushNotifications', () => {
  it('no-ops in the Tauri runtime instead of throwing', async () => {
    isTauri.mockReturnValue(true);

    await expect(
      enablePushNotifications(matrixClient as never, clientConfig, [
        null,
        vi.fn<(sub: unknown) => void>(),
      ])
    ).resolves.toBeUndefined();
  });
});

describe('disablePushNotifications', () => {
  it('no-ops in the Tauri runtime', async () => {
    isTauri.mockReturnValue(true);

    await expect(
      disablePushNotifications(matrixClient as never, clientConfig, [
        null,
        vi.fn<(sub: unknown) => void>(),
      ])
    ).resolves.toBeUndefined();
  });
});

describe('togglePusher', () => {
  it('does not throw in the Tauri runtime when push is enabled', async () => {
    isTauri.mockReturnValue(true);

    await expect(
      togglePusher(matrixClient as never, clientConfig, true, true, [
        null,
        vi.fn<(sub: unknown) => void>(),
      ])
    ).resolves.toBeUndefined();
  });
});

type PusherPayload = Record<string, unknown>;

function PushManagerStub() {}

const withBrowserPushEnvironment = () => {
  const subscription = {
    endpoint: 'https://push.example/endpoint',
    toJSON: () => ({
      endpoint: 'https://push.example/endpoint',
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    }),
    unsubscribe: vi.fn<() => Promise<boolean>>(async () => true),
  };
  const registration = {
    pushManager: {
      getSubscription: vi.fn<() => Promise<unknown>>(async () => null),
      subscribe: vi.fn<() => Promise<unknown>>(async () => subscription),
    },
  };
  vi.stubGlobal('navigator', {
    language: 'ru',
    // Страница НЕ контролируется воркером — ровно случай COR-2454.
    serviceWorker: { ready: Promise.resolve(registration), controller: null },
  });
  vi.stubGlobal('window', { PushManager: PushManagerStub });
  return { registration, subscription };
};

describe('регистрация пушера без контроллера сервис-воркера', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('пишет пушер вызовом API, а не сообщением воркеру', async () => {
    isTauri.mockReturnValue(false);
    withBrowserPushEnvironment();
    const setPusher = vi.fn<(pusher: PusherPayload) => Promise<unknown>>(async () => ({}));
    const mx = {
      baseUrl: 'https://server.example',
      getAccessToken: () => 'token',
      getDeviceId: () => 'DEVICE',
      getDevice: async () => ({ display_name: 'Браузер' }),
      setPusher,
    };

    await enablePushNotifications(mx as never, { pushNotificationDetails: {} } as never, [
      null,
      vi.fn<(sub: unknown) => void>(),
    ]);

    expect(setPusher).toHaveBeenCalledTimes(1);
    expect(setPusher).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'http', pushkey: 'p256dh-key' })
    );
  });

  it('отказ сервера доходит до вызывающего, а не теряется', async () => {
    isTauri.mockReturnValue(false);
    withBrowserPushEnvironment();
    const mx = {
      baseUrl: 'https://server.example',
      getAccessToken: () => 'token',
      getDeviceId: () => 'DEVICE',
      getDevice: async () => ({ display_name: 'Браузер' }),
      setPusher: vi.fn<(pusher: PusherPayload) => Promise<unknown>>(async () => {
        throw new Error('M_UNKNOWN');
      }),
    };

    await expect(
      enablePushNotifications(mx as never, { pushNotificationDetails: {} } as never, [
        null,
        vi.fn<(sub: unknown) => void>(),
      ])
    ).rejects.toThrow('M_UNKNOWN');
  });

  it('выключение удаляет пушер тем же путём', async () => {
    isTauri.mockReturnValue(false);
    withBrowserPushEnvironment();
    const setPusher = vi.fn<(pusher: PusherPayload) => Promise<unknown>>(async () => ({}));
    const mx = { baseUrl: 'https://server.example', getAccessToken: () => 'token', setPusher };

    await disablePushNotifications(
      mx as never,
      { pushNotificationDetails: {} } as never,
      [
        {
          endpoint: 'https://push.example/endpoint',
          keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
        },
        vi.fn<(sub: unknown) => void>(),
      ] as never
    );

    expect(setPusher).toHaveBeenCalledWith(
      expect.objectContaining({ kind: null, pushkey: 'p256dh-key' })
    );
  });
});
