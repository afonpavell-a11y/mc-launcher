import { http } from '../utils/retry';
import { Logger } from './Logger';
import { uuidV3FromName } from '../utils/hash';
import type { Profile } from '../../shared/types';

const MS_CLIENT_ID = '00000000402b5328'; // Публичный Minecraft Client ID
const SCOPE = 'XboxLive.signin offline_access';

export interface DeviceCodeResponse {
  user_code: string;
  device_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

export class AuthService {
  static async startDeviceCode(): Promise<DeviceCodeResponse> {
    const { data } = await http.post(
      'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode',
      new URLSearchParams({ client_id: MS_CLIENT_ID, scope: SCOPE }),
    );
    return data;
  }

  static async pollForToken(deviceCode: string, interval: number, onStatus?: (m: string) => void): Promise<{ access_token: string; refresh_token: string }> {
    const deadline = Date.now() + 15 * 60 * 1000;
    let wait = interval * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, wait));
      try {
        const { data } = await http.post(
          'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
          new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            client_id: MS_CLIENT_ID,
            device_code: deviceCode,
          }),
        );
        return { access_token: data.access_token, refresh_token: data.refresh_token };
      } catch (err: any) {
        const code = err.response?.data?.error;
        if (code === 'authorization_pending') { onStatus?.('Ожидание подтверждения...'); continue; }
        if (code === 'slow_down') { wait += 5000; continue; }
        throw new Error(`OAuth failed: ${code ?? err.message}`);
      }
    }
    throw new Error('OAuth device code expired');
  }

  static async authenticateMicrosoft(msAccessToken: string): Promise<Profile> {
    // 1) XBL
    const xbl = await http.post('https://user.auth.xboxlive.com/user/authenticate', {
      Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${msAccessToken}` },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT',
    });
    // 2) XSTS
    const xsts = await http.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
      Properties: { SandboxId: 'RETAIL', UserTokens: [xbl.data.Token] },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT',
    });
    // 3) Minecraft
    const mc = await http.post('https://api.minecraftservices.com/authentication/login_with_xbox', {
      identityToken: `XBL3.0 x=${xsts.data.DisplayClaims.xui[0].uhs};${xsts.data.Token}`,
    });
    // 4) Profile
    const profileRes = await http.get('https://api.minecraftservices.com/minecraft/profile', {
      headers: { Authorization: `Bearer ${mc.data.access_token}` },
    });

    Logger.info('Microsoft auth success', profileRes.data.name);

    return {
      id: profileRes.data.id,
      uuid: profileRes.data.id,
      name: profileRes.data.name,
      type: 'microsoft',
      accessToken: mc.data.access_token,
      refreshToken: msAccessToken,
      status: 'online',
      createdAt: Date.now(),
    };
  }

  static createOffline(name: string): Profile {
    const uuid = uuidV3FromName(name);
    return {
      id: uuid,
      uuid,
      name,
      type: 'offline',
      status: 'offline',
      createdAt: Date.now(),
    };
  }
}