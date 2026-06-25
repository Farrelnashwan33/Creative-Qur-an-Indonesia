<script lang="ts">
	import { page } from '$app/state';
	import { BookOpen, Home, Users, UserCheck, GraduationCap, LayoutDashboard, LogOut, Menu, Bell, BookMarked, Calendar, Volume2 } from 'lucide-svelte';

	let { data, children } = $props();
	
	let role = data.role;
	let isSidebarOpen = $state(false);

	const adminMenu = [
		{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
		{ name: 'Data Santri', path: '/dashboard/admin/santri', icon: Users },
		{ name: 'Data Ustadz', path: '/dashboard/admin/ustadz', icon: UserCheck },
		{ name: 'Data Kelas', path: '/dashboard/admin/kelas', icon: GraduationCap },
		{ name: 'Data Hafalan', path: '/dashboard/admin/hafalan', icon: BookOpen },
		{ name: 'Data Murajaah', path: '/dashboard/admin/murajaah', icon: BookMarked },
		{ name: 'Jadwal', path: '/dashboard/admin/jadwal', icon: Calendar },
		{ name: 'Pengumuman', path: '/dashboard/admin/pengumuman', icon: Volume2 }
	];

	const ustadzMenu = [
		{ name: 'Dashboard', path: '/dashboard/ustadz', icon: LayoutDashboard },
		{ name: 'Santri Binaan', path: '/dashboard/ustadz/santri', icon: Users },
		{ name: 'Input Hafalan', path: '/dashboard/ustadz/hafalan', icon: BookOpen },
		{ name: 'Input Murajaah', path: '/dashboard/ustadz/murajaah', icon: BookMarked },
		{ name: 'Jadwal Mengajar', path: '/dashboard/ustadz/jadwal', icon: Calendar },
		{ name: 'Pengumuman', path: '/dashboard/ustadz/pengumuman', icon: Volume2 }
	];

	const santriMenu = [
		{ name: 'Dashboard', path: '/dashboard/santri', icon: LayoutDashboard },
		{ name: 'Hafalan Saya', path: '/dashboard/santri/hafalan', icon: BookOpen },
		{ name: 'Murajaah Saya', path: '/dashboard/santri/murajaah', icon: BookMarked },
		{ name: 'Jadwal Setoran', path: '/dashboard/santri/jadwal', icon: Calendar },
		{ name: 'Pengumuman', path: '/dashboard/santri/pengumuman', icon: Volume2 },
		{ name: 'Profil Saya', path: '/dashboard/santri/profil', icon: UserCheck }
	];

	const waliMenu = [
		{ name: 'Dashboard', path: '/dashboard/wali', icon: LayoutDashboard },
		{ name: 'Perkembangan Anak', path: '/dashboard/wali/perkembangan', icon: BookOpen },
		{ name: 'Nilai & Laporan', path: '/dashboard/wali/nilai', icon: BookMarked },
		{ name: 'Jadwal', path: '/dashboard/wali/jadwal', icon: Calendar },
		{ name: 'Pengumuman', path: '/dashboard/wali/pengumuman', icon: Volume2 }
	];

	let menus = $derived(
		role === 'admin' ? adminMenu :
		role === 'ustadz' ? ustadzMenu :
		role === 'santri' ? santriMenu :
		waliMenu
	);

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}
</script>

<div class="drawer lg:drawer-open bg-base-200/50 min-h-screen">
	<input id="dashboard-drawer" type="checkbox" class="drawer-toggle" bind:checked={isSidebarOpen} />
	
	<!-- Main Content -->
	<div class="drawer-content flex flex-col">
		<!-- Navbar -->
		<div class="navbar glass sticky top-0 z-30 flex justify-between px-4 lg:px-8 border-b border-white/10">
			<div class="flex-none lg:hidden">
				<label for="dashboard-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
					<Menu class="w-6 h-6" />
				</label>
			</div>
			
			<div class="flex-1">
				<h1 class="text-xl font-bold font-arabic-utsmani text-emerald-500 lg:hidden">CQ</h1>
				<div class="hidden lg:block text-sm breadcrumbs text-content-secondary">
					<ul>
						<li><a>Dashboard</a></li>
						<li><span class="capitalize">{role}</span></li>
					</ul>
				</div>
			</div>
			
			<div class="flex-none gap-4 items-center">
				<button class="btn btn-ghost btn-circle">
					<div class="indicator">
						<Bell class="w-5 h-5 text-content-primary" />
						<span class="badge badge-xs badge-primary indicator-item"></span>
					</div>
				</button>
				
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar border border-emerald-500/30">
						<div class="w-10 rounded-full">
							<img alt="User Avatar" src="https://ui-avatars.com/api/?name={data.user?.email}&background=1e7a5c&color=fff" />
						</div>
					</div>
					<ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-white/10">
						<li class="menu-title px-4 py-2">
							<span class="text-xs opacity-70">Masuk sebagai</span>
							<span class="font-bold truncate text-content-primary">{data.user?.email}</span>
							<span class="badge badge-sm badge-outline badge-primary mt-1 capitalize">{role}</span>
						</li>
						<div class="divider my-0"></div>
						<li><a href="/dashboard/profil" class="py-3">Profil Saya</a></li>
						<li><a href="/settings" class="py-3">Pengaturan</a></li>
						<li class="text-error"><a href="/logout" class="py-3"><LogOut class="w-4 h-4 mr-2" /> Keluar</a></li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Page Content -->
		<main class="flex-1 p-4 lg:p-8 overflow-y-auto">
			{@render children()}
		</main>
	</div>
	
	<!-- Sidebar -->
	<div class="drawer-side z-40 shadow-2xl">
		<label for="dashboard-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
		<div class="w-72 min-h-full bg-base-100 border-r border-white/5 flex flex-col">
			<!-- Sidebar Header -->
			<div class="p-6 border-b border-white/5 flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
					<BookOpen class="w-6 h-6" />
				</div>
				<div>
					<h2 class="font-bold text-lg leading-tight text-content-primary font-arabic-utsmani">Creative Qur'an</h2>
					<p class="text-xs text-content-secondary">Sistem Akademik</p>
				</div>
			</div>
			
			<!-- Navigation Menu -->
			<ul class="menu p-4 w-full text-base-content flex-1 gap-1">
				<li class="menu-title text-content-secondary/70 uppercase tracking-wider text-[10px] font-bold mb-2">Menu Utama</li>
				{#each menus as menu}
					<li>
						<a 
							href={menu.path} 
							class="py-3 {page.url.pathname === menu.path || (page.url.pathname.startsWith(menu.path) && menu.path !== '/dashboard') ? 'active bg-emerald-500/10 text-emerald-400 font-medium' : 'text-content-secondary hover:bg-white/5'}"
							onclick={() => isSidebarOpen = false}
						>
							<menu.icon class="w-5 h-5 mr-3 {page.url.pathname === menu.path ? 'text-emerald-500' : 'opacity-70'}" />
							{menu.name}
						</a>
					</li>
				{/each}
			</ul>

			<!-- Sidebar Footer -->
			<div class="p-4 border-t border-white/5">
				<a href="/logout" class="btn btn-outline btn-error w-full gap-2">
					<LogOut class="w-4 h-4" />
					Keluar
				</a>
			</div>
		</div>
	</div>
</div>
