// Entry point: register all custom elements and announce card to Home Assistant

import { SensorHeatmapCard } from './weather-heatmap-card.js';
import { SensorHeatmapCardEditor } from './editor.js';
import { VERSION } from './constants.js';

// Extended card with an optional signed temperature adjustment applied only to
// forecast values. Historical/live sensor values are intentionally unchanged.
class WeatherHeatmapCard extends SensorHeatmapCard {
  setConfig(config) {
    if (config.temperature_adjustment !== undefined &&
        (typeof config.temperature_adjustment !== 'number' || !Number.isFinite(config.temperature_adjustment))) {
      throw new Error('temperature_adjustment must be a number');
    }
    super.setConfig(config);
    this._config.temperature_adjustment = config.temperature_adjustment !== undefined
      ? config.temperature_adjustment
      : 0;
  }

  async _fetchForecastData() {
    await super._fetchForecastData();
    const adjustment = this._config.temperature_adjustment || 0;
    if (adjustment === 0) return;

    if (this._forecastData) {
      Object.values(this._forecastData).forEach(forecast => {
        if (forecast.high !== null) forecast.high = Number(forecast.high) + adjustment;
        if (forecast.low !== null) forecast.low = Number(forecast.low) + adjustment;
      });
    }

    if (this._forecastHourly) {
      Object.values(this._forecastHourly).forEach(forecast => {
        if (forecast.temperature !== null) {
          forecast.temperature = Number(forecast.temperature) + adjustment;
        }
      });
    }
  }
}

if (!customElements.get('ha-weather-heatmap-card')) {
  customElements.define('ha-weather-heatmap-card', WeatherHeatmapCard);
}

class TemperatureHeatmapCardLegacy extends WeatherHeatmapCard {}
class WindspeedHeatmapCardLegacy extends WeatherHeatmapCard {}

if (!customElements.get('ha-temperature-heatmap-card')) {
  customElements.define('ha-temperature-heatmap-card', TemperatureHeatmapCardLegacy);
}
if (!customElements.get('windspeed-heatmap-card')) {
  customElements.define('windspeed-heatmap-card', WindspeedHeatmapCardLegacy);
}

if (!customElements.get('ha-weather-heatmap-card-editor')) {
  customElements.define('ha-weather-heatmap-card-editor', SensorHeatmapCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: 'ha-weather-heatmap-card',
    name: 'Weather Heatmap Card',
    description: 'Heatmap visualization for temperature or wind speed sensors',
    preview: false,
    getEntitySuggestion: (hass, entityId) => {
      const entityState = hass.states[entityId];
      if (!entityState) return null;
      if (entityId.split('.')[0] !== 'sensor') return null;
      const deviceClass = entityState.attributes.device_class;
      if (deviceClass === 'temperature') {
        return { config: { type: 'custom:ha-weather-heatmap-card', entity: entityId, card_type: 'temperature' } };
      }
      if (deviceClass === 'wind_speed') {
        return { config: { type: 'custom:ha-weather-heatmap-card', entity: entityId, card_type: 'windspeed' } };
      }
      if (deviceClass === 'humidity') {
        return { config: { type: 'custom:ha-weather-heatmap-card', entity: entityId, card_type: 'humidity' } };
      }
      return null;
    }
  },
  {
    type: 'ha-temperature-heatmap-card',
    name: 'Temperature Heatmap Card (legacy)',
    description: 'Legacy name - use ha-weather-heatmap-card instead',
    preview: false,
  },
  {
    type: 'windspeed-heatmap-card',
    name: 'Windspeed Heatmap Card (legacy)',
    description: 'Legacy name - use ha-weather-heatmap-card instead',
    preview: false,
  }
);

console.info(
  '%c WEATHER-HEATMAP-CARD %c ' + VERSION + ' ',
  'color: black; background: #F2720C; font-weight: 600;',
  'color: black; background: #00a5c9; font-weight: 600;'
);
