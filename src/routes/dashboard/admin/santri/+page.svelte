<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	
	let { data } = $props();
	
	const columns = [
		{ key: 'nis', label: 'NIS' },
		{ key: 'nama_lengkap', label: 'Nama Lengkap' },
		{ key: 'jenis_kelamin', label: 'L/P' },
		{ key: 'kelas', label: 'Kelas' },
		{ key: 'nama_wali', label: 'Wali' },
		{ 
			key: 'status_aktif', 
			label: 'Status',
			render: (val: boolean) => 
				val ? `<div class="badge badge-success badge-sm gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span>Aktif</div>` 
					: `<div class="badge badge-error badge-sm gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span>Nonaktif</div>`
		}
	];

	function handleAdd() {
		// Open add modal
		alert("Fitur Tambah Santri belum disambungkan ke modal");
	}

	function handleEdit(row: any) {
		// Open edit modal
		alert(`Edit Santri: ${row.nama_lengkap}`);
	}

	function handleDelete(row: any) {
		if(confirm(`Yakin ingin menghapus data santri ${row.nama_lengkap}?`)) {
			alert("Data dihapus (dummy)");
		}
	}
</script>

<svelte:head>
	<title>Data Santri - Admin Dashboard</title>
</svelte:head>

<div class="mb-6">
	<div class="text-sm breadcrumbs text-content-secondary mb-2">
		<ul>
			<li><a href="/dashboard">Dashboard</a></li>
			<li><a href="/dashboard/admin/santri">Admin</a></li>
			<li><span class="text-emerald-500 font-medium">Data Santri</span></li>
		</ul>
	</div>
</div>

<DataTable 
	title="Manajemen Data Santri" 
	subtitle="Kelola data seluruh santri yang terdaftar"
	{columns} 
	data={data.santri} 
	searchPlaceholder="Cari NIS, Nama, Kelas..."
	onAdd={handleAdd}
	onEdit={handleEdit}
	onDelete={handleDelete}
/>
