import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Action, C, Field, Icon, Page, s } from '@/components/design';
import { articles, faqs } from '@/data/content';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';

export default function Resources() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { language } = useApp();
  const term = search.trim().toLowerCase();
  const matchingArticles = articles.filter(article => `${t(article.title, language)} ${t(article.tag, language)} ${article.text.map(text => t(text, language)).join(' ')}`.toLowerCase().includes(term));
  const matchingQuestions = faqs.filter(([question, answer]) => `${t(question, language)} ${t(answer, language)}`.toLowerCase().includes(term));
  return <Page back title="Farm knowledge library" subtitle="Short, useful reading for your next step.">
    <Field label="Search resources" placeholder="Animals, crops, feed…" value={search} onChangeText={setSearch} />
    {matchingArticles.length > 0 && <Text style={s.h2}>{t('Helpful guides', language)}</Text>}
    {matchingArticles.map(article => <TouchableOpacity key={article.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/article/[id]', params: { id: article.id } })} style={[s.card, s.row, { backgroundColor: article.color }]}><View style={{ backgroundColor: C.white, padding: 12, borderRadius: 14 }}><Icon name={article.icon} size={25} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.label}>{t(article.tag, language)}</Text><Text style={s.h3}>{t(article.title, language)}</Text><Text style={s.small}>{t(article.time, language)} {t('read', language)}</Text></View><Icon name="chevron-forward" size={17} /></TouchableOpacity>)}
    {matchingQuestions.length > 0 && <Text style={s.h2}>{t('Common questions', language)}</Text>}
    {matchingQuestions.map(([question, answer]) => <TouchableOpacity key={question} accessibilityRole="button" accessibilityState={{ expanded: expanded === question }} onPress={() => setExpanded(expanded === question ? null : question)} style={s.card}><View style={s.between}><Text style={[s.h3, { flex: 1 }]}>{t(question, language)}</Text><Icon name={expanded === question ? 'remove' : 'add'} size={18} /></View>{expanded === question && <Text style={s.body}>{t(answer, language)}</Text>}</TouchableOpacity>)}
    {!matchingArticles.length && !matchingQuestions.length && <Text style={s.body}>{t('No resources match. Try “crops” or “animals”.', language)}</Text>}
    <Action title="Ask a question" onPress={() => router.push('/(tabs)/assistant')} />
  </Page>;
}
