<script lang="ts">
	import { Users, UserCheck, GraduationCap, BookOpen, Activity, TrendingUp } from 'lucide-svelte';

	let { data } = $props();
	const { stats, recentActivities } = data;
</script>

<svelte:head>
	<title>Admin Dashboard - Creative Qur'an</title>
</svelte:head>

<div class="mb-8">
	<h1 class="text-3xl font-bold text-content-primary">Overview</h1>
	<p class="text-content-secondary mt-1">Ringkasan data akademik sistem Creative Qur'an</p>
</div>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
	<div class="glass md3-card p-6 flex items-center gap-4 hover:border-emerald-500/50 transition-colors">
		<div class="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
			<Users class="w-7 h-7" />
		</div>
		<div>
			<p class="text-content-secondary text-sm font-medium">Total Santri</p>
			<h3 class="text-3xl font-bold text-content-primary">{stats.totalSantri}</h3>
		</div>
	</div>

	<div class="glass md3-card p-6 flex items-center gap-4 hover:border-emerald-500/50 transition-colors">
		<div class="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
			<UserCheck class="w-7 h-7" />
		</div>
		<div>
			<p class="text-content-secondary text-sm font-medium">Total Ustadz</p>
			<h3 class="text-3xl font-bold text-content-primary">{stats.totalUstadz}</h3>
		</div>
	</div>

	<div class="glass md3-card p-6 flex items-center gap-4 hover:border-emerald-500/50 transition-colors">
		<div class="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
			<GraduationCap class="w-7 h-7" />
		</div>
		<div>
			<p class="text-content-secondary text-sm font-medium">Total Kelas</p>
			<h3 class="text-3xl font-bold text-content-primary">{stats.totalKelas}</h3>
		</div>
	</div>

	<div class="glass md3-card p-6 flex items-center gap-4 hover:border-emerald-500/50 transition-colors">
		<div class="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
			<BookOpen class="w-7 h-7" />
		</div>
		<div>
			<p class="text-content-secondary text-sm font-medium">Total Hafalan</p>
			<h3 class="text-3xl font-bold text-content-primary">{stats.totalHafalan}</h3>
		</div>
	</div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Chart Section (Placeholder) -->
	<div class="lg:col-span-2 glass md3-card p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-bold text-content-primary flex items-center gap-2">
				<TrendingUp class="w-5 h-5 text-emerald-500" />
				Grafik Perkembangan
			</h2>
			<select class="select select-bordered select-sm bg-base-200">
				<option>7 Hari Terakhir</option>
				<option>1 Bulan Terakhir</option>
				<option>Tahun Ini</option>
			</select>
		</div>
		
		<div class="w-full h-72 rounded-xl bg-base-200/50 border border-white/5 flex items-center justify-center">
			<!-- Here you would integrate Chart.js or ApexCharts -->
			<div class="text-center opacity-50">
				<Activity class="w-12 h-12 mx-auto mb-2 opacity-50" />
				<p>Area Grafik Perkembangan</p>
				<p class="text-xs mt-1">Integrasi Charting Library</p>
			</div>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="glass md3-card p-6">
		<h2 class="text-xl font-bold text-content-primary mb-6 flex items-center gap-2">
			<Activity class="w-5 h-5 text-emerald-500" />
			Aktivitas Terbaru
		</h2>
		
		<ul class="space-y-6">
			{#each recentActivities as activity}
				<li class="flex gap-4 relative">
					<!-- Timeline line -->
					<div class="absolute left-4 top-10 bottom-[-1.5rem] w-0.5 bg-white/10 last:hidden"></div>
					
					<div class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 
						{activity.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 
						 activity.type === 'info' ? 'bg-blue-500/20 text-blue-500' :
						 activity.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
						 'bg-base-300 text-content-secondary'}"
					>
						<span class="w-2.5 h-2.5 rounded-full bg-current"></span>
					</div>
					<div>
						<p class="font-medium text-content-primary text-sm">{activity.action}</p>
						<p class="text-content-secondary text-sm mt-0.5">{activity.desc}</p>
						<span class="text-xs text-content-secondary/70 block mt-1">{activity.time}</span>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</div>
