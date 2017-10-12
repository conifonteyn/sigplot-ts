/**
 * Author:  Thomas Goodwin
 * Company: Geon Technologies, LLC
 *
 * Generic 1D line plot with highlight capabilities, etc.
 */
import { ILayerSettings } from './layer';
import { IHighlight, Layer1D } from './layer1d';
import { BasePlot, IConstructorOptions } from './plot';

import {
    AxisData,
    BlueHeaderOptions,
    FormatSize,
    FormatType,
    IBlueHeaderOptions
} from './bluefile';

const DEFAULT_SIGNAL = 'signal';

/**
 * Interface containing the layer number and the length of data
 * drawn in it.
 */
interface DataLayer {
    /** The layer number */
    layerNumber?: number;

    /** Length of data plotted */
    frameSize?: number;
}

/**
 * Map of Data Layers to their data ID
 */
interface DataLayers {
    /** Key-value pair of data ID to its layer information */
    [dataId: string]: DataLayer;
}

/**
 * The LinePlot is a one-dimensional representation of data, for example
 * sinusoids, PSD, and FFT.  It supports plotting multiple lines at the same
 * time by using unique Data IDs, which become the names in the plot's legend.
 * @preferred
 */
export class LinePlot extends BasePlot {

    /** Internal layer mapping */
    private _dataLayers: DataLayers = {};

    /**
     * Push the data buffer to the plot.
     * @param buffer - Data to Plot
     * @param size - Size/Shape of the data (complex, real, etc.)
     * @param type - Data Type of the buffer (int8, etc.)
     * @param xAxis - Description of the X-axis for the plot
     * @param dataId - ID uniquely representing the data.
     */
    push(
        buffer: any[],
        size:   FormatSize = FormatSize.Complex,
        type:   FormatType = FormatType.Float32,
        xAxis:  AxisData = {},
        dataId: string = DEFAULT_SIGNAL
        ) {
        const options = BlueHeaderOptions.type1000(size, type, xAxis);
        const dl = this.dataLayer(dataId, options, buffer.length);

        // TODO: sync and/or rsync?
        this._plot.push(dl.layerNumber, buffer, options);
    }

    /**
     * Get the plotting Layer 
     *
     * @param dataId - The dataId corresponding to the layer.
     */
    getLayer(dataId: string = DEFAULT_SIGNAL): Layer1D {
        return <Layer1D> this._plot.get_layer(this.dataLayer(dataId).layerNumber);
    }

    /**
     * Removes the (data signal) layer corresponding to the dataId from the plot
     *
     * @param dataId - The data signal ID corresponding to the layer.
     */
    removeLayer(dataId: string = DEFAULT_SIGNAL): void {
        this._plot.remove_layer(this.dataLayer(dataId).layerNumber);
    }

    /**
     * This is a simple way to mess with color, opacity, etc. while a plot is
     * instantiated.
     *
     * That said: use with caution!  You can incidentally override various
     * settings that may have really awful effects in SigPlot.
     *
     * @param settings - The settings to change in the layer
     * @param dataId - The data signal ID corresponding to the layer
     */
    changeLayerSettings(settings: ILayerSettings, dataId: string = DEFAULT_SIGNAL) {
        let layer = this.getLayer(dataId);
        if (layer !== undefined) {
            for (let k in settings) {
                if (settings.hasOwnProperty(k)) {
                    layer[k] = settings[k];
                }
            }
        }
    }

    /**
     * Add a highlight to the dataId's plot
     * @param highlight - The highlight to apply.
     * @param dataId - The data signal ID corresponding to the layer.
     */
    addHighlight(highlight: IHighlight, dataId: string = DEFAULT_SIGNAL) {
        const l = this.getLayer(dataId);
        if (l !== undefined) {
            l.add_highlight(highlight);
        }
    }

    /**
     * Remove a highlight from dataId's plot
     * @param highlight - The highlight to apply.
     * @param dataId - The data signal ID corresponding to the layer.
     */
    removeHighlight(highlight: IHighlight, dataId: string = DEFAULT_SIGNAL) {
        const l = this.getLayer(dataId);
        if (l !== undefined) {
            l.remove_highlight(highlight);
        }
    }

    /**
     * Clear all highlights for a given dataId
     * @param dataId - The data signal ID corresponding to the layer.
     */
    clearHighlights(dataId: string = DEFAULT_SIGNAL) {
        const l = this.getLayer(dataId);
        if (l !== undefined) {
            l.clear_highlights();
        }
    }

    /**
     * Get the Layer ID for the data ID.  If it doesn't exist, create one using
     * the provided header options.
     *
     * @param dataId - Data (signal) ID whose layer to fetch from the map
     * @param options - header options
     * @return The data layer for the SigPlot layer
     */
    private dataLayer(
        dataId:     string = DEFAULT_SIGNAL,
        options?:   IBlueHeaderOptions,
        frameSize?: number
        ): DataLayer {

        let val: DataLayer;

        if (this._dataLayers[dataId] !== undefined) {
            val = this._dataLayers[dataId];

            // Resize if the length of data changed.
            if (val.frameSize !== frameSize && frameSize !== undefined) {
                this.getLayer(dataId)
                    .change_settings({ framesize: frameSize });
                val.frameSize = frameSize;
            }
        } else {
            // Setting the 'name' layer option identifies it on the legend
            // if visible.  Setting the framesize gives us an initial pipe size.
            val = {
                frameSize,
                layerNumber: this._plot.overlay_pipe(
                    options,
                    { framesize: frameSize, name: dataId }
                    )
            };
            this._dataLayers[dataId] = val;
        }

        return val;
    }
}
