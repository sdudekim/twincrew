export interface CountryData {
  name: string;
  nameKo: string;
  coordinates: [number, number]; // [longitude, latitude]
  webhookUrl?: string;
}

export const countryCoordinates: Record<string, CountryData> = {
  'Peru': {
    name: 'Peru',
    nameKo: '페루',
    coordinates: [-75.0152, -9.1900],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Argentina': {
    name: 'Argentina',
    nameKo: '아르헨티나',
    coordinates: [-63.6167, -38.4161],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Thailand': {
    name: 'Thailand',
    nameKo: '태국',
    coordinates: [100.9925, 15.8700],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/48fc6796-3dcd-458a-9652-4b246d9c7cfe'
  },
  'Egypt': {
    name: 'Egypt',
    nameKo: '이집트',
    coordinates: [30.8025, 26.8206],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f58e7420-82ad-4a71-a986-98e64ec0b17e'
  },
  'Panama': {
    name: 'Panama',
    nameKo: '파나마',
    coordinates: [-80.7821, 8.5380],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Japan': {
    name: 'Japan',
    nameKo: '일본',
    coordinates: [138.2529, 36.2048],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'United Kingdom': {
    name: 'United Kingdom',
    nameKo: '영국',
    coordinates: [-3.4360, 55.3781],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Australia': {
    name: 'Australia',
    nameKo: '호주',
    coordinates: [133.7751, -25.2744],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Canada': {
    name: 'Canada',
    nameKo: '캐나다',
    coordinates: [-106.3468, 56.1304],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Brazil': {
    name: 'Brazil',
    nameKo: '브라질',
    coordinates: [-51.9253, -14.2350],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Germany': {
    name: 'Germany',
    nameKo: '독일',
    coordinates: [10.4515, 51.1657],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Turkey': {
    name: 'Turkey',
    nameKo: '터키',
    coordinates: [35.2433, 38.9637],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Mexico': {
    name: 'Mexico',
    nameKo: '멕시코',
    coordinates: [-102.5528, 23.6345],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'South Korea': {
    name: 'South Korea',
    nameKo: '대한민국',
    coordinates: [127.7669, 35.9078],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'France': {
    name: 'France',
    nameKo: '프랑스',
    coordinates: [2.2137, 46.2276],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'India': {
    name: 'India',
    nameKo: '인도',
    coordinates: [78.9629, 20.5937],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Spain': {
    name: 'Spain',
    nameKo: '스페인',
    coordinates: [-3.7492, 40.4637],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  },
  'Italy': {
    name: 'Italy',
    nameKo: '이탈리아',
    coordinates: [12.5674, 41.8719],
    webhookUrl: 'https://dev.eaip.lge.com/n8n/webhook/f00e8ecc-d96d-43b8-95cd-13d95fc7dd44'
  }
};

export const getAllCountryNames = (): string[] => {
  return Object.keys(countryCoordinates).sort();
};
