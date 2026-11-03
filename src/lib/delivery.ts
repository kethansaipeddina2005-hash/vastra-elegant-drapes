export interface DeliveryRate {
  country_code: string;
  country_name: string;
  amount: number;
  free_above: number | null;
}

const names = new Intl.DisplayNames(['en'], { type: 'region' });
export const deliveryCountries = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
  .split(' ').map(code => ({ code, name: names.of(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const countryName = (code: string) => deliveryCountries.find(c => c.code === code)?.name || code;
export const defaultDeliveryRates: DeliveryRate[] = [
  { country_code: 'IN', country_name: 'India', amount: 200, free_above: 2000 },
  { country_code: '*', country_name: 'Other countries', amount: 4000, free_above: null },
];

export function deliveryCharge(rates: DeliveryRate[], country: string, subtotal: number): number {
  const rate = rates.find(r => r.country_code === country || r.country_name.toLowerCase() === country.toLowerCase())
    || (country !== 'IN' && country.toLowerCase() !== 'india' ? rates.find(r => r.country_code === '*') : undefined)
    || defaultDeliveryRates[country === 'IN' || country.toLowerCase() === 'india' ? 0 : 1];
  return rate.free_above !== null && subtotal > Number(rate.free_above) ? 0 : Number(rate.amount);
}