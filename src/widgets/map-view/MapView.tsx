import styled from 'styled-components';

const MapContainer = styled.div`
  width: 100%;
  min-height: 420px;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(22, 29, 58, 0.94), rgba(12, 16, 34, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.75);
`;

export const MapView = () => (
  <MapContainer>
    <div>
      <h2>Live courier map</h2>
      <p>Realtime positions will show here when connected to the socket feed.</p>
    </div>
  </MapContainer>
);
