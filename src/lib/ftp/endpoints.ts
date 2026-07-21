import type { FtpProtocol, PlatformKey } from '../domain';

export type FtpEndpoint = {
  host: string;
  protocol: FtpProtocol;
  port: number;
};

// Confirmed upload endpoints for the 3 MVP platforms. 'getty' has no FTP endpoint yet.
export const FTP_ENDPOINTS: Partial<Record<PlatformKey, FtpEndpoint>> = {
  alamy: { host: 'upload.alamy.com', protocol: 'ftp', port: 21 },
  adobe: { host: 'sftp.contributor.adobestock.com', protocol: 'sftp', port: 22 },
  shutterstock: { host: 'ftps.shutterstock.com', protocol: 'ftps', port: 21 },
};
