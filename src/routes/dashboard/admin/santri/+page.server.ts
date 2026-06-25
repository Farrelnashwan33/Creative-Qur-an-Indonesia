import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// In production, fetch from supabase
	// const { data } = await locals.supabase.from('santri').select('*, kelas(nama_kelas), wali(nama_lengkap)');
	
	const dummySantri = [
		{
			id: '1',
			nis: '1001',
			nama_lengkap: 'Ahmad Muzakki',
			jenis_kelamin: 'Laki-laki',
			kelas: 'Tahfidz 1A',
			nama_wali: 'Budi Santoso',
			status_aktif: true
		},
		{
			id: '2',
			nis: '1002',
			nama_lengkap: 'Siti Aminah',
			jenis_kelamin: 'Perempuan',
			kelas: 'Tahfidz 1B',
			nama_wali: 'Sutomo',
			status_aktif: true
		},
		{
			id: '3',
			nis: '1003',
			nama_lengkap: 'Fatimah Az-Zahra',
			jenis_kelamin: 'Perempuan',
			kelas: 'Tahsin 2A',
			nama_wali: 'Umar',
			status_aktif: false
		}
	];

	return {
		santri: dummySantri
	};
};
