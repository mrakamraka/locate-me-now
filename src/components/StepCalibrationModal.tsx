import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Ruler, Footprints, Volume2, Vibrate, Settings2 } from 'lucide-react';

export interface StepSettings {
  heightCm: number;
  stepLengthM: number;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

interface StepCalibrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: StepSettings;
  onSaveSettings: (settings: StepSettings) => void;
}

// Calculate step length based on height (average adult formula)
const calculateStepLength = (heightCm: number): number => {
  // Step length is approximately 0.413 * height for walking
  return (heightCm / 100) * 0.413;
};

// Height presets for quick selection
const HEIGHT_PRESETS = [
  { label: '150 cm', value: 150 },
  { label: '160 cm', value: 160 },
  { label: '170 cm', value: 170 },
  { label: '180 cm', value: 180 },
  { label: '190 cm', value: 190 },
];

const StepCalibrationModal: React.FC<StepCalibrationModalProps> = ({
  open,
  onOpenChange,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<StepSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleHeightChange = (value: number[]) => {
    const height = value[0];
    const stepLength = calculateStepLength(height);
    setLocalSettings(prev => ({
      ...prev,
      heightCm: height,
      stepLengthM: stepLength,
    }));
  };

  const handleStepLengthChange = (value: number[]) => {
    setLocalSettings(prev => ({
      ...prev,
      stepLengthM: value[0],
    }));
  };

  const handlePresetClick = (height: number) => {
    const stepLength = calculateStepLength(height);
    setLocalSettings(prev => ({
      ...prev,
      heightCm: height,
      stepLengthM: stepLength,
    }));
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onOpenChange(false);
  };

  const testVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const testSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.05);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-crypto-card border-crypto-border text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings2 className="w-5 h-5 text-crypto-gold" />
            Step Counter Settings
          </DialogTitle>
          <DialogDescription className="text-crypto-muted">
            Calibrate step counting for more accurate GPS-based tracking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Height Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-white">
                <Ruler className="w-4 h-4 text-crypto-purple" />
                Your Height
              </Label>
              <span className="text-crypto-gold font-bold text-lg">
                {localSettings.heightCm} cm
              </span>
            </div>
            
            <Slider
              value={[localSettings.heightCm]}
              onValueChange={handleHeightChange}
              min={120}
              max={220}
              step={1}
              className="w-full"
            />
            
            <div className="flex flex-wrap gap-2">
              {HEIGHT_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset.value)}
                  className={`border-crypto-border ${
                    localSettings.heightCm === preset.value
                      ? 'bg-crypto-gold/20 border-crypto-gold text-crypto-gold'
                      : 'text-crypto-muted hover:text-white hover:border-white'
                  }`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Step Length Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-white">
                <Footprints className="w-4 h-4 text-crypto-green" />
                Step Length
              </Label>
              <span className="text-crypto-green font-bold text-lg">
                {localSettings.stepLengthM.toFixed(2)} m
              </span>
            </div>
            
            <Slider
              value={[localSettings.stepLengthM]}
              onValueChange={handleStepLengthChange}
              min={0.4}
              max={1.2}
              step={0.01}
              className="w-full"
            />
            
            <p className="text-xs text-crypto-muted">
              Adjust manually if your natural walking stride is different
            </p>
          </div>

          {/* Feedback Settings */}
          <div className="space-y-4 pt-4 border-t border-crypto-border">
            <h4 className="text-sm font-medium text-crypto-muted uppercase tracking-wider">
              Step Feedback
            </h4>
            
            {/* Vibration Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="w-5 h-5 text-crypto-purple" />
                <div>
                  <Label className="text-white">Vibration</Label>
                  <p className="text-xs text-crypto-muted">Vibrate on each step</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testVibration}
                  className="text-crypto-muted hover:text-white text-xs"
                >
                  Test
                </Button>
                <Switch
                  checked={localSettings.vibrationEnabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({ ...prev, vibrationEnabled: checked }))
                  }
                />
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-crypto-gold" />
                <div>
                  <Label className="text-white">Sound</Label>
                  <p className="text-xs text-crypto-muted">Play sound on each step</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testSound}
                  className="text-crypto-muted hover:text-white text-xs"
                >
                  Test
                </Button>
                <Switch
                  checked={localSettings.soundEnabled}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-crypto-border text-crypto-muted hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-crypto-gold to-crypto-gold/80 text-crypto-dark font-semibold"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StepCalibrationModal;
