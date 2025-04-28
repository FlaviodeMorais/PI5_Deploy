import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface PumpFlowControlProps {
  currentFlow?: number;
  onFlowChange?: (flow: number) => void;
}

export function PumpFlowControl({ currentFlow = 0, onFlowChange }: PumpFlowControlProps) {
  const { toast } = useToast();
  const [flowRate, setFlowRate] = useState(currentFlow);
  
  // Definir cores com base no fluxo
  const getFlowColor = (value: number) => {
    if (value === 0) return 'bg-gray-300';
    if (value < 30) return 'bg-blue-300';
    if (value < 70) return 'bg-blue-500';
    return 'bg-blue-700';
  };
  
  // Definir texto de status
  const getFlowStatus = (value: number) => {
    if (value === 0) return 'Desligada';
    if (value < 30) return 'Baixa';
    if (value < 70) return 'Média';
    return 'Alta';
  };

  // Mutation para atualizar a vazão da bomba
  const { mutate: updatePumpFlow, isPending } = useMutation({
    mutationFn: async (newFlow: number) => {
      const response = await fetch('/api/emulator/control/pump-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flowRate: newFlow }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao ajustar vazão da bomba');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Vazão da bomba atualizada',
        description: `Vazão ajustada para ${data.pumpFlow}%`,
        variant: 'default',
      });
      
      // Invalidar queries para atualizar os dados na interface
      queryClient.invalidateQueries({ queryKey: ['/api/emulator/virtual-sensors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emulator/status'] });
      
      // Chamar callback se fornecido
      if (onFlowChange) {
        onFlowChange(data.pumpFlow);
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao ajustar vazão: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleValueChange = (value: number[]) => {
    setFlowRate(value[0]);
  };

  const handleApplyFlow = () => {
    updatePumpFlow(flowRate);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          <i className="fas fa-tint mr-2 text-blue-500"></i> 
          Controle de Vazão da Bomba
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status atual */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Status:</Label>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getFlowColor(flowRate)}`}></div>
              <span className="font-medium">{getFlowStatus(flowRate)}</span>
            </div>
          </div>
          
          {/* Valor atual */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Vazão atual:</Label>
            <span className="text-lg font-bold text-blue-600">{flowRate}%</span>
          </div>
          
          {/* Slider */}
          <div className="pt-2">
            <Slider
              defaultValue={[flowRate]}
              max={100}
              step={5}
              onValueChange={handleValueChange}
              className="py-4"
              disabled={isPending}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Botões de presets */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setFlowRate(0)}
              className={flowRate === 0 ? 'border-blue-500 bg-blue-50' : ''}
            >
              0%
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setFlowRate(25)}
              className={flowRate === 25 ? 'border-blue-500 bg-blue-50' : ''}
            >
              25%
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setFlowRate(50)}
              className={flowRate === 50 ? 'border-blue-500 bg-blue-50' : ''}
            >
              50%
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setFlowRate(100)}
              className={flowRate === 100 ? 'border-blue-500 bg-blue-50' : ''}
            >
              100%
            </Button>
          </div>
          
          {/* Botão de aplicar */}
          <Button 
            className="w-full" 
            disabled={isPending || flowRate === currentFlow}
            onClick={handleApplyFlow}
          >
            {isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Atualizando...
              </>
            ) : (
              <>Aplicar Vazão</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}