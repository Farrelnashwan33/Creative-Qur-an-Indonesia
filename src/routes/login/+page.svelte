<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { BookOpen, Mail, Lock, LogIn, Loader2 } from 'lucide-svelte';

	let { form } = $props<{ form: ActionData }>();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Login - Sistem Akademik Hafalan Qur'an</title>
</svelte:head>

<div class="min-h-screen premium-theme flex items-center justify-center p-4">
	<div class="w-full max-w-md animate-slide-up">
		<!-- Logo / Header -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-20 h-20 rounded-full glass-emerald mb-4 premium-sparkle">
				<BookOpen class="w-10 h-10 text-emerald-400" />
			</div>
			<h1 class="text-3xl font-bold font-arabic-utsmani premium-gold-text mb-2">
				Creative Qur'an
			</h1>
			<p class="text-content-secondary">Sistem Akademik Hafalan & Murajaah</p>
		</div>

		<!-- Login Card -->
		<div class="glass md3-card premium-border p-8">
			<h2 class="text-2xl font-semibold text-content-primary mb-6">Masuk ke Akun Anda</h2>

			{#if form?.error}
				<div class="alert alert-error bg-red-500/10 border-red-500/20 text-red-400 mb-6 rounded-xl">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
					<span>{form.error}</span>
				</div>
			{/if}

			<form
				method="POST"
				action="?/login"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="space-y-4"
			>
				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text text-content-secondary">Email</span>
					</label>
					<label class="input input-bordered flex items-center gap-2 bg-base-200/50 focus-within:border-emerald-500">
						<Mail class="w-5 h-5 opacity-70" />
						<input
							type="email"
							id="email"
							name="email"
							class="grow text-content-primary placeholder:text-content-secondary/50"
							placeholder="nama@email.com"
							value={form?.values?.email ?? ''}
							required
						/>
					</label>
				</div>

				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text text-content-secondary">Password</span>
						<a href="/forgot-password" class="label-text-alt link link-hover text-emerald-400">Lupa password?</a>
					</label>
					<label class="input input-bordered flex items-center gap-2 bg-base-200/50 focus-within:border-emerald-500">
						<Lock class="w-5 h-5 opacity-70" />
						<input
							type="password"
							id="password"
							name="password"
							class="grow text-content-primary placeholder:text-content-secondary/50"
							placeholder="••••••••"
							required
						/>
					</label>
				</div>

				<div class="form-control mt-6">
					<button type="submit" class="btn border-none bg-emerald-600 hover:bg-emerald-500 text-white w-full rounded-xl" disabled={loading}>
						{#if loading}
							<Loader2 class="w-5 h-5 animate-spin" />
							Memproses...
						{:else}
							<LogIn class="w-5 h-5" />
							Masuk Sekarang
						{/if}
					</button>
				</div>
			</form>
		</div>

		<!-- Footer -->
		<p class="text-center text-content-secondary text-sm mt-8 opacity-70">
			&copy; {new Date().getFullYear()} Creative Qur'an Indonesia.<br/>All rights reserved.
		</p>
	</div>
</div>
