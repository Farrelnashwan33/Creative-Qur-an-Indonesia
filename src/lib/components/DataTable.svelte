<script lang="ts">
	import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-svelte';

	// Props
	let {
		title = 'Data',
		subtitle = 'Kelola data',
		columns = [],
		data = [],
		searchPlaceholder = 'Cari...',
		showAddButton = true,
		addText = 'Tambah Baru',
		onAdd = () => {},
		onEdit = (row: any) => {},
		onDelete = (row: any) => {}
	} = $props<{
		title?: string;
		subtitle?: string;
		columns: { key: string; label: string; render?: (val: any, row: any) => string | any }[];
		data: any[];
		searchPlaceholder?: string;
		showAddButton?: boolean;
		addText?: string;
		onAdd?: () => void;
		onEdit?: (row: any) => void;
		onDelete?: (row: any) => void;
	}>();

	let searchQuery = $state('');
	let currentPage = $state(1);
	let itemsPerPage = 10;

	// Computed values using $derived
	let filteredData = $derived(
		data.filter((row) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return Object.values(row).some((val) => 
				String(val).toLowerCase().includes(q)
			);
		})
	);

	let totalPages = $derived(Math.ceil(filteredData.length / itemsPerPage) || 1);

	let paginatedData = $derived(
		filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	function nextPage() {
		if (currentPage < totalPages) currentPage++;
	}

	function prevPage() {
		if (currentPage > 1) currentPage--;
	}

	// Reset page when search changes
	$effect(() => {
		searchQuery; // dependency
		currentPage = 1;
	});
</script>

<div class="glass md3-card p-0 overflow-hidden border border-white/10">
	<!-- Header -->
	<div class="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold text-content-primary">{title}</h2>
			<p class="text-sm text-content-secondary mt-1">{subtitle}</p>
		</div>

		<div class="flex flex-col sm:flex-row gap-3">
			<label class="input input-bordered input-sm flex items-center gap-2 bg-base-200/50">
				<Search class="w-4 h-4 opacity-70" />
				<input type="text" class="grow" placeholder={searchPlaceholder} bind:value={searchQuery} />
			</label>
			
			<button class="btn btn-sm btn-outline border-white/10 text-content-secondary">
				<Filter class="w-4 h-4 mr-2" /> Filter
			</button>

			{#if showAddButton}
				<button class="btn btn-sm bg-emerald-600 hover:bg-emerald-500 text-white border-none" onclick={onAdd}>
					<Plus class="w-4 h-4 mr-1" /> {addText}
				</button>
			{/if}
		</div>
	</div>

	<!-- Table -->
	<div class="overflow-x-auto">
		<table class="table table-zebra w-full text-sm">
			<thead class="bg-base-200/50 text-content-secondary uppercase text-xs tracking-wider">
				<tr>
					{#each columns as col}
						<th class="font-semibold py-4 px-6">{col.label}</th>
					{/each}
					<th class="text-right py-4 px-6">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if paginatedData.length === 0}
					<tr>
						<td colspan={columns.length + 1} class="text-center py-12 text-content-secondary">
							Tidak ada data ditemukan.
						</td>
					</tr>
				{/if}

				{#each paginatedData as row, i}
					<tr class="hover:bg-white/5 transition-colors border-white/5">
						{#each columns as col}
							<td class="py-3 px-6 text-content-primary">
								{#if col.render}
									{@html col.render(row[col.key], row)}
								{:else}
									{row[col.key]}
								{/if}
							</td>
						{/each}
						<td class="py-3 px-6 text-right space-x-2">
							<button class="btn btn-xs btn-square btn-ghost text-blue-400 hover:bg-blue-500/20" onclick={() => onEdit(row)} title="Edit">
								<Edit2 class="w-4 h-4" />
							</button>
							<button class="btn btn-xs btn-square btn-ghost text-red-400 hover:bg-red-500/20" onclick={() => onDelete(row)} title="Hapus">
								<Trash2 class="w-4 h-4" />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	<div class="p-4 border-t border-white/5 flex items-center justify-between text-sm text-content-secondary bg-base-200/30">
		<div>
			Menampilkan {(currentPage - 1) * itemsPerPage + 1} sampai {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
		</div>
		<div class="join">
			<button class="join-item btn btn-sm btn-ghost" onclick={prevPage} disabled={currentPage === 1}>
				<ChevronLeft class="w-4 h-4" />
			</button>
			<button class="join-item btn btn-sm btn-ghost pointer-events-none">
				Halaman {currentPage} dari {totalPages}
			</button>
			<button class="join-item btn btn-sm btn-ghost" onclick={nextPage} disabled={currentPage === totalPages}>
				<ChevronRight class="w-4 h-4" />
			</button>
		</div>
	</div>
</div>
