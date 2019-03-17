import { getFormattedDistance } from './distance-formatter';

describe('Distance formatter', () => {
  it('formats under 1km correctly in metric', () => {
    const distance = 500;
    const formattedDistance = getFormattedDistance(distance, true);
    expect(formattedDistance.formatted).toBe('500m');
  });

  it('formats over 1km correctly in metric', () => {
    const distance = 1100;
    const formattedDistance = getFormattedDistance(distance, true);
    expect(formattedDistance.formatted).toBe('1.10km');
  });

  it('formats distance correctly in miles', () => {
    const distance = 5000;
    const formattedDistance = getFormattedDistance(distance, false);
    expect(formattedDistance.formatted).toBe('3.11mi'); // 3.10686
  });
});
