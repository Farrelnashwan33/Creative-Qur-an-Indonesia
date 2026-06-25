import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// For now, we will return some dummy statistical data until we have real data
	// In production, you would fetch this from Supabase, e.g.:
	// const { count: santriCount } = await locals.supabase.from('santri').select('*', { count: 'exact', head: true });
	
	const stats = {
		totalSantri: 156,
		totalUstadz: 12,
		totalKelas: 8,
		totalHafalan: 1240
	};

	const recentActivities = [
		{ id: 1, action: 'Setoran Baru', desc: 'Ahmad Muzakki menyetor Juz 30', time: '10 menit yang lalu', type: 'success' },
		{ id: 2, action: 'Santri Baru', desc: 'Siti Aminah mendaftar', time: '1 jam yang lalu', type: 'info' },
		{ id: 3, action: 'Murajaah', desc: 'Budi Santoso murajaah Surat Yasin', time: '3 jam yang lalu', type: 'warning' },
		{ id: 4, action: 'Pengumuman', desc: 'Jadwal ujian semester', time: '1 hari yang lalu', type: 'neutral' }
	];

	return {
		stats,
		recentActivities
	};
};
