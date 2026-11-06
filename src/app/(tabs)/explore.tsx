import { useState } from 'react';
import { Text, View } from 'react-native';
import { Field, Page, s } from '@/components/design';
import { ServiceCard } from '@/components/ServiceCard';
import { services } from '@/data/content';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
export default function Explore() {
  const [search, setSearch] = useState(''); const { language } = useApp(); const query = search.toLowerCase(); const matches = services.filter(x => `${t(x.title, language)} ${t(x.detail, language)}`.toLowerCase().includes(query));
  return <Page title="A helping hand for every need" subtitle="Choose a service to find guidance for your farm."><Field label="Find a service" placeholder="Animals, crops, nutrition…" value={search} onChangeText={setSearch} /><View style={{ ...s.row, flexWrap: 'wrap' }}>{matches.map(service => <ServiceCard key={service.id} service={service} />)}</View>{!matches.length && <Text style={s.body}>{t('No services match. Try “crops” or “animals”.', language)}</Text>}</Page>;
}
