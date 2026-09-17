/**
 * Para tutarını Türkçe resmi fatura formatında yazıya çeviren yardımcı fonksiyon.
 * Örn: 15420.50 -> "Yalnız On Beş Bin Dört Yüz Yirmi Türk Lirası Elli Kuruştur."
 */
export function numberToTurkishWords(amount: number = 0): string {
  if (isNaN(amount) || amount === 0) {
    return 'Yalnız Sıfır Türk Lirasıdır.';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const lira = Math.floor(absAmount);
  const kurus = Math.round((absAmount - lira) * 100);

  const units = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
  const tens = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];

  function convertGroup(num: number): string {
    let res = '';
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const ten = Math.floor(remainder / 10);
    const unit = remainder % 10;

    if (hundreds > 0) {
      if (hundreds === 1) {
        res += 'Yüz ';
      } else {
        res += units[hundreds] + ' Yüz ';
      }
    }

    if (ten > 0) {
      res += tens[ten] + ' ';
    }

    if (unit > 0) {
      res += units[unit] + ' ';
    }

    return res.trim();
  }

  function convertLira(num: number): string {
    if (num === 0) return 'Sıfır';

    const scales = ['', 'Bin', 'Milyon', 'Milyar', 'Trilyon'];
    let parts: string[] = [];
    let scaleIndex = 0;

    while (num > 0) {
      const group = num % 1000;
      if (group > 0) {
        let groupText = convertGroup(group);
        if (scaleIndex === 1 && group === 1) {
          // "Bir Bin" değil sadece "Bin" denir
          groupText = 'Bin';
        } else if (scales[scaleIndex]) {
          groupText += ' ' + scales[scaleIndex];
        }
        parts.unshift(groupText);
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }

    return parts.join(' ');
  }

  let text = isNegative ? 'Eksi ' : '';
  text += convertLira(lira) + ' Türk Lirası';

  if (kurus > 0) {
    text += ' ' + convertGroup(kurus) + ' Kuruş';
  }

  return `Yalnız ${text}tur.`;
}
