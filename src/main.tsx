import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import type { ConfigProviderProps } from 'antd';
import arEG from 'antd/locale/ar_EG';
import enUS from 'antd/locale/en_US';
import urPK from 'antd/locale/ur_PK';
import type { Lang } from './api';
import { App } from './App';
import { AuthProvider } from './auth';
import { I18nProvider, isRtl, useI18n } from './i18n';
import './styles.css';

const ANTD_LOCALE: Record<Lang, ConfigProviderProps['locale']> = { en: enUS, ar: arEG, ur: urPK };

/** antd direction + locale follow the UI language (Arabic and Urdu = RTL). */
function Themed() {
  const { lang, dir } = useI18n();
  return (
    <ConfigProvider
      direction={dir}
      locale={ANTD_LOCALE[lang]}
      theme={{
        token: {
          colorPrimary: '#0f766e',
          borderRadius: 8,
          // Noto Sans Arabic covers the extra Urdu letters (ٹ ڈ ڑ ں ے).
          fontFamily: isRtl(lang)
            ? "'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif"
            : "Inter, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Arabic', sans-serif",
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <Themed />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
);
