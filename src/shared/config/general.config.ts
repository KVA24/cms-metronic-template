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
  API_URL: window.API_DOMAIN || import.meta.env.VITE_API_URL,
  GOOGLE_RECAPTCHA_KEY:
    window.GOOGLE_RECAPTCHA_KEY || import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  REACT_QUERY_DEBUG:
    window.REACT_QUERY_DEBUG || import.meta.env.VITE_REACT_QUERY_DEBUG,
};

export { generalSettings, generalConfig };
