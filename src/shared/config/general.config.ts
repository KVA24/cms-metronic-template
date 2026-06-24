const generalSettings = {
  purchaseLink: 'https://1.envato.market/Vm7VRE',
  docsLink: '',
  licenseLink: '',
  devsLink: 'https://devs.keenthemes.com',
  faqLink: 'https://keenthemes.com/metronic',
  aboutLink: 'https://keenthemes.com/metronic',
};

const generalConfig = {
  TOKEN_EXPIRE_DAYS: 16,
  TOKEN_NAME: 'token',
  REFRESH_TOKEN_NAME: 'refresh-token',
  API_URL: (window as any).API_DOMAIN,
  GOOGLE_RECAPTCHA_KEY: (window as any).GOOGLE_RECAPTCHA_KEY,
  REACT_QUERY_DEBUG: (window as any).REACT_QUERY_DEBUG,
};

export { generalSettings, generalConfig };
