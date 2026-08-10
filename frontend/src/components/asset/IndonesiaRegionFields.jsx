import { useEffect, useMemo, useState } from "react";
import FormSelect from "../form/FormSelect";
import {
  findIndonesiaRegionByName,
  getIndonesiaDistricts,
  getIndonesiaProvinces,
  getIndonesiaRegencies,
  getIndonesiaVillages,
  normalizeIndonesiaRegionName,
} from "../../services/indonesiaRegions";

const EMPTY_REGION_STATE = { parentId: "", items: [], error: "" };
const EMPTY_REGIONS = [];

const createOptions = (regions, storedValue) => {
  const normalizedStoredValue = normalizeIndonesiaRegionName(storedValue);
  const options = regions.map((region) => ({
    value: normalizeIndonesiaRegionName(region.name) === normalizedStoredValue
      ? storedValue
      : region.name,
    label: region.name,
  }));

  if (storedValue && !findIndonesiaRegionByName(regions, storedValue)) {
    options.unshift({ value: storedValue, label: `${storedValue} (data tersimpan)` });
  }

  return options;
};

export default function IndonesiaRegionFields({ values, onChange }) {
  const [provinceState, setProvinceState] = useState({ items: null, error: "" });
  const [regencyState, setRegencyState] = useState(EMPTY_REGION_STATE);
  const [districtState, setDistrictState] = useState(EMPTY_REGION_STATE);
  const [villageState, setVillageState] = useState(EMPTY_REGION_STATE);

  const provinces = provinceState.items || EMPTY_REGIONS;
  const provinceId = findIndonesiaRegionByName(provinces, values.provinsi)?.id || "";
  const regencies = regencyState.parentId === provinceId
    ? regencyState.items
    : EMPTY_REGIONS;
  const regencyId = findIndonesiaRegionByName(regencies, values.kabupaten_kota)?.id || "";
  const districts = districtState.parentId === regencyId
    ? districtState.items
    : EMPTY_REGIONS;
  const districtId = findIndonesiaRegionByName(districts, values.kecamatan)?.id || "";
  const villages = villageState.parentId === districtId
    ? villageState.items
    : EMPTY_REGIONS;

  useEffect(() => {
    let active = true;
    getIndonesiaProvinces()
      .then((items) => {
        if (active) setProvinceState({ items, error: "" });
      })
      .catch(() => {
        if (active) {
          setProvinceState({
            items: [],
            error: "Data wilayah Indonesia gagal dimuat. Periksa koneksi internet lalu buka ulang form.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!provinceId || regencyState.parentId === provinceId) return;
    let active = true;
    getIndonesiaRegencies(provinceId)
      .then((items) => {
        if (active) setRegencyState({ parentId: provinceId, items, error: "" });
      })
      .catch(() => {
        if (active) {
          setRegencyState({
            parentId: provinceId,
            items: [],
            error: "Kabupaten/Kota gagal dimuat.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [provinceId, regencyState.parentId]);

  useEffect(() => {
    if (!regencyId || districtState.parentId === regencyId) return;
    let active = true;
    getIndonesiaDistricts(regencyId)
      .then((items) => {
        if (active) setDistrictState({ parentId: regencyId, items, error: "" });
      })
      .catch(() => {
        if (active) {
          setDistrictState({
            parentId: regencyId,
            items: [],
            error: "Kecamatan gagal dimuat.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [districtState.parentId, regencyId]);

  useEffect(() => {
    if (!districtId || villageState.parentId === districtId) return;
    let active = true;
    getIndonesiaVillages(districtId)
      .then((items) => {
        if (active) setVillageState({ parentId: districtId, items, error: "" });
      })
      .catch(() => {
        if (active) {
          setVillageState({
            parentId: districtId,
            items: [],
            error: "Desa/Kelurahan gagal dimuat.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [districtId, villageState.parentId]);

  const provinceOptions = useMemo(
    () => createOptions(provinces, values.provinsi),
    [provinces, values.provinsi],
  );
  const regencyOptions = useMemo(
    () => createOptions(regencies, values.kabupaten_kota),
    [regencies, values.kabupaten_kota],
  );
  const districtOptions = useMemo(
    () => createOptions(districts, values.kecamatan),
    [districts, values.kecamatan],
  );
  const villageOptions = useMemo(
    () => createOptions(villages, values.desa_kelurahan),
    [villages, values.desa_kelurahan],
  );

  const isLoadingProvinces = provinceState.items === null;
  const isLoadingRegencies = Boolean(provinceId && regencyState.parentId !== provinceId);
  const isLoadingDistricts = Boolean(regencyId && districtState.parentId !== regencyId);
  const isLoadingVillages = Boolean(districtId && villageState.parentId !== districtId);
  const loadError = provinceState.error
    || (regencyState.parentId === provinceId ? regencyState.error : "")
    || (districtState.parentId === regencyId ? districtState.error : "")
    || (villageState.parentId === districtId ? villageState.error : "");

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <FormSelect
          label="Provinsi"
          name="provinsi"
          value={values.provinsi}
          onChange={(event) => onChange({
            provinsi: event.target.value,
            kabupaten_kota: "",
            kecamatan: "",
            desa_kelurahan: "",
          })}
          options={provinceOptions}
          placeholder={isLoadingProvinces ? "Memuat provinsi..." : "Pilih Provinsi"}
          disabled={isLoadingProvinces}
          size="lg"
        />
        <FormSelect
          label="Kabupaten/Kota"
          name="kabupaten_kota"
          value={values.kabupaten_kota}
          onChange={(event) => onChange({
            kabupaten_kota: event.target.value,
            kecamatan: "",
            desa_kelurahan: "",
          })}
          options={regencyOptions}
          placeholder={isLoadingRegencies ? "Memuat kabupaten/kota..." : "Pilih Kabupaten/Kota"}
          disabled={!provinceId || isLoadingRegencies}
          size="lg"
        />
        <FormSelect
          label="Kecamatan"
          name="kecamatan"
          value={values.kecamatan}
          onChange={(event) => onChange({
            kecamatan: event.target.value,
            desa_kelurahan: "",
          })}
          options={districtOptions}
          placeholder={isLoadingDistricts ? "Memuat kecamatan..." : "Pilih Kecamatan"}
          disabled={!regencyId || isLoadingDistricts}
          size="lg"
        />
        <FormSelect
          label="Desa/Kelurahan"
          name="desa_kelurahan"
          value={values.desa_kelurahan}
          onChange={(event) => onChange({ desa_kelurahan: event.target.value })}
          options={villageOptions}
          placeholder={isLoadingVillages ? "Memuat desa/kelurahan..." : "Pilih Desa/Kelurahan"}
          disabled={!districtId || isLoadingVillages}
          size="lg"
        />
      </div>
      {loadError && <p className="text-xs text-red-600 dark:text-red-400">{loadError}</p>}
    </div>
  );
}
