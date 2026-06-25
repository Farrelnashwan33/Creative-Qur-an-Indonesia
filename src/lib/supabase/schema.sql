-- Creative Qur'an Indonesia - Sistem Akademik Hafalan Qur'an
-- Run this script in your Supabase SQL Editor to setup the database tables and Row Level Security.

-- 1. Create enum for Roles and Status
CREATE TYPE user_role AS ENUM ('admin', 'ustadz', 'santri', 'wali');
CREATE TYPE status_hafalan AS ENUM ('Lancar', 'Murajaah', 'Perlu Perbaikan');

-- 2. Profiles Table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'santri',
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Ustadz Table
CREATE TABLE ustadz (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    nama_lengkap TEXT NOT NULL,
    no_telp TEXT,
    jenis_kelamin TEXT CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    status_aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE ustadz ENABLE ROW LEVEL SECURITY;

-- 4. Wali Table
CREATE TABLE wali (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- wali may not have a login profile initially
    nama_lengkap TEXT NOT NULL,
    no_telp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE wali ENABLE ROW LEVEL SECURITY;

-- 5. Kelas Table
CREATE TABLE kelas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nama_kelas TEXT NOT NULL,
    wali_kelas_id UUID REFERENCES ustadz(id) ON DELETE SET NULL,
    tahun_ajaran TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;

-- 6. Santri Table
CREATE TABLE santri (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- santri may not have a login profile initially
    nis TEXT UNIQUE NOT NULL,
    nama_lengkap TEXT NOT NULL,
    jenis_kelamin TEXT CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    tempat_lahir TEXT,
    tanggal_lahir DATE,
    alamat TEXT,
    no_telp TEXT,
    wali_id UUID REFERENCES wali(id) ON DELETE SET NULL,
    kelas_id UUID REFERENCES kelas(id) ON DELETE SET NULL,
    foto_profil TEXT,
    status_aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE santri ENABLE ROW LEVEL SECURITY;

-- 7. Hafalan Table
CREATE TABLE hafalan (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    santri_id UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
    ustadz_id UUID REFERENCES ustadz(id) ON DELETE SET NULL,
    juz INTEGER NOT NULL CHECK (juz >= 1 AND juz <= 30),
    nama_surah TEXT NOT NULL,
    ayat_awal INTEGER NOT NULL,
    ayat_akhir INTEGER NOT NULL,
    tanggal_setoran DATE NOT NULL DEFAULT CURRENT_DATE,
    nilai_kelancaran INTEGER CHECK (nilai_kelancaran >= 0 AND nilai_kelancaran <= 100),
    nilai_tajwid INTEGER CHECK (nilai_tajwid >= 0 AND nilai_tajwid <= 100),
    catatan TEXT,
    status status_hafalan NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE hafalan ENABLE ROW LEVEL SECURITY;

-- 8. Murajaah Table
CREATE TABLE murajaah (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    santri_id UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
    juz INTEGER NOT NULL CHECK (juz >= 1 AND juz <= 30),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    nilai INTEGER CHECK (nilai >= 0 AND nilai <= 100),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE murajaah ENABLE ROW LEVEL SECURITY;

-- 9. Jadwal Table
CREATE TABLE jadwal (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hari TEXT NOT NULL,
    jam TEXT NOT NULL,
    kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE NOT NULL,
    ustadz_id UUID REFERENCES ustadz(id) ON DELETE SET NULL,
    ruangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE jadwal ENABLE ROW LEVEL SECURITY;

-- 10. Pengumuman Table
CREATE TABLE pengumuman (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    judul TEXT NOT NULL,
    isi_pengumuman TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Function to check role
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;


-- ADMIN: Access everything
-- Admin bypasses all these table checks below via an "Admin All Access" policy on all tables
-- But for simplicity we define specific policies below


-- Profiles
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());

-- Ustadz
CREATE POLICY "Admins can manage ustadz" ON ustadz FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Everyone can read ustadz" ON ustadz FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ustadz can update own info" ON ustadz FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- Wali
CREATE POLICY "Admins can manage wali" ON wali FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Wali can read own data" ON wali FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Wali can update own info" ON wali FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- Kelas
CREATE POLICY "Admins can manage kelas" ON kelas FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Everyone can read kelas" ON kelas FOR SELECT TO authenticated USING (true);

-- Santri
CREATE POLICY "Admins can manage santri" ON santri FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Ustadz can read all santri" ON santri FOR SELECT TO authenticated USING (auth_user_role() = 'ustadz');
CREATE POLICY "Wali can read own child santri" ON santri FOR SELECT TO authenticated USING (
    wali_id IN (SELECT id FROM wali WHERE profile_id = auth.uid())
);
CREATE POLICY "Santri can read own data" ON santri FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- Hafalan
CREATE POLICY "Admins can manage hafalan" ON hafalan FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Ustadz can manage hafalan" ON hafalan FOR ALL TO authenticated USING (auth_user_role() = 'ustadz');
CREATE POLICY "Santri can read own hafalan" ON hafalan FOR SELECT TO authenticated USING (
    santri_id IN (SELECT id FROM santri WHERE profile_id = auth.uid())
);
CREATE POLICY "Wali can read own child hafalan" ON hafalan FOR SELECT TO authenticated USING (
    santri_id IN (SELECT id FROM santri WHERE wali_id IN (SELECT id FROM wali WHERE profile_id = auth.uid()))
);

-- Murajaah
CREATE POLICY "Admins can manage murajaah" ON murajaah FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Ustadz can manage murajaah" ON murajaah FOR ALL TO authenticated USING (auth_user_role() = 'ustadz');
CREATE POLICY "Santri can read own murajaah" ON murajaah FOR SELECT TO authenticated USING (
    santri_id IN (SELECT id FROM santri WHERE profile_id = auth.uid())
);
CREATE POLICY "Wali can read own child murajaah" ON murajaah FOR SELECT TO authenticated USING (
    santri_id IN (SELECT id FROM santri WHERE wali_id IN (SELECT id FROM wali WHERE profile_id = auth.uid()))
);

-- Jadwal
CREATE POLICY "Admins can manage jadwal" ON jadwal FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Everyone can read jadwal" ON jadwal FOR SELECT TO authenticated USING (true);

-- Pengumuman
CREATE POLICY "Admins can manage pengumuman" ON pengumuman FOR ALL TO authenticated USING (auth_user_role() = 'admin');
CREATE POLICY "Ustadz can manage pengumuman" ON pengumuman FOR ALL TO authenticated USING (auth_user_role() = 'ustadz');
CREATE POLICY "Everyone can read pengumuman" ON pengumuman FOR SELECT TO authenticated USING (true);


-- Trigger to automatically create a profile for new users signing up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'santri'); -- default to santri, admin changes later
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
