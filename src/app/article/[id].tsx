import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Icon, Page, s } from '@/components/design';
import { articles } from '@/data/content';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
export default function Article() {
  const { id } = useLocalSearchParams<{ id: string }>(); const article = articles.find(a => a.id === id); const { language } = useApp();
  if (!article) return <Page back title="Article not found"><Text style={s.body}>{t('Return home to browse the available guides.', language)}</Text></Page>;
  return <Page back><View style={{ backgroundColor: article.color, borderRadius: 25, padding: 25, gap: 18 }}><Icon name={article.icon} size={42} /><Text style={s.label}>{t(article.tag, language)} · {t(article.time, language)} {t('READ', language)}</Text><Text style={s.title}>{t(article.title, language)}</Text></View>{article.text.map((p, i) => <View key={p} style={{ gap: 8 }}><Text style={s.h3}>0{i + 1} · {t(['Observe', 'Keep a record', 'Discuss with an expert'][i], language)}</Text><Text style={s.body}>{t(p, language)}</Text></View>)}<Action title="Ask a follow-up question" onPress={() => router.push('/(tabs)/assistant')} /></Page>;
}
