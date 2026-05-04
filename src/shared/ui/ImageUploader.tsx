import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { api } from '@shared/api/base';

type Props = {
  value?: string | null;
  onChange: (payload: { url: string; file?: File | null } | null) => void;
  label?: string;
};

const Wrapper = styled.div` display: flex; flex-direction: column; gap: 8px; `;
const Preview = styled.div` width: 120px; height: 120px; border-radius: 8px; overflow: hidden; background: #111; display: flex; align-items: center; justify-content: center; `;
const Img = styled.img` width: 100%; height: 100%; object-fit: cover; `;
const Button = styled.button` padding: 8px 12px; border-radius: 6px; border: 1px solid #444; background: #1f2937; color: white; cursor: pointer; `;
const HiddenInput = styled.input` display: none; `;

export const ImageUploader = ({ value, onChange, label }: Props) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const onFileChosen = async (file: File) => {
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await api.post<{ url: string }>('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url ?? '';
      const preview = URL.createObjectURL(file);
      setLocalPreview(preview);
      onChange({ url, file });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Upload failed', e);
    }
  };

  return (
    <Wrapper onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => {
      e.preventDefault(); setDragOver(false);
      const f = e.dataTransfer?.files?.[0]; if (f) onFileChosen(f);
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Preview>{localPreview ? <Img src={localPreview} alt="avatar" /> : (value ? <Img src={value} alt="avatar" /> : <span>Загрузить</span>)}</Preview>
        <Button type="button" onClick={() => fileRef.current?.click()} style={{ height: 32 }}>
          Выбрать файл
        </Button>
      </div>
      <HiddenInput ref={fileRef} type="file" accept="image/*" onChange={(e) => {
        const f = e.target.files?.[0]; if (f) onFileChosen(f);
      }} />
      {label && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{label}</span>}
    </Wrapper>
  );
};
