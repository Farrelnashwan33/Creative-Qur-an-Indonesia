import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const dummyHafalan = [
		{
			id: '1',
			santri: 'Ahmad Muzakki',
			ustadz: 'Ust. Fulan',
			juz: 30,
			surah: 'An-Naba',
			ayat: '1-40',
			tanggal: '2023-10-25',
			nilai_kelancaran: 90,
			nilai_tajwid: 85,
			status: 'Lancar'
		},
		{
			id: '2',
			santri: 'Siti Aminah',
			ustadz: 'Ust. Fulanah',
			juz: 30,
			surah: 'An-Nazi\'at',
			ayat: '1-46',
			tanggal: '2023-10-26',
			nilai_kelancaran: 75,
			nilai_tajwid: 80,
			status: 'Murajaah'
		}
	];

	return {
		hafalan: dummyHafalan
	};
};
