import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Loader2, MessageCircle, RefreshCw, Unplug, Smartphone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Unit } from "@/hooks/useUnits";
import { useUnitEvolutionWhatsApp } from "@/hooks/useUnitEvolutionWhatsApp";

interface UnitWhatsAppIntegrationProps {
  unit: Unit;
  onConnectionChange?: () => void;
}

export interface UnitWhatsAppIntegrationRef {
  cleanupOnClose: () => Promise<void>;
}

export const UnitWhatsAppIntegration = forwardRef<UnitWhatsAppIntegrationRef, UnitWhatsAppIntegrationProps>(
  ({ unit, onConnectionChange }, ref) => {
    const {
      connectionState,
      qrCode,
      pairingCode,
      isLoading,
      profile,
      createInstance,
      disconnect,
      refreshQRCode,
      cleanup,
    } = useUnitEvolutionWhatsApp(unit);

    // Timeout state for QR code generation
    const [showRetry, setShowRetry] = useState(false);

    // Show retry button if QR code doesn't appear within 15 seconds
    useEffect(() => {
      if ((connectionState === 'connecting' || connectionState === 'loading') && !qrCode) {
        const timeout = setTimeout(() => setShowRetry(true), 15000);
        return () => clearTimeout(timeout);
      }
      setShowRetry(false);
    }, [connectionState, qrCode]);

    // Handle retry - cleanup failed instance before creating new one
    const handleRetry = async () => {
      setShowRetry(false);
      await cleanup();
      await createInstance();
    };

    // Format phone number for display
    const formatPhone = (phone: string | null) => {
      if (!phone) return null;
      // Format as +55 65 99989-1722
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length >= 12) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
      }
      return `+${cleaned}`;
    };

    // Expose cleanup method to parent via ref
    useImperativeHandle(ref, () => ({
      cleanupOnClose: async () => {
        // Cleanup if not connected (connecting, loading, error states)
        if (connectionState !== "open" && connectionState !== "disconnected") {
          console.log(`Modal closing during ${connectionState} state, cleaning up orphaned instance...`);
          await cleanup();
        }
      },
    }), [connectionState, cleanup]);

    const handleConnect = async () => {
      await createInstance();
      onConnectionChange?.();
    };

    const handleDisconnect = async () => {
      await disconnect();
      onConnectionChange?.();
    };

    const renderStatusBadge = () => {
      switch (connectionState) {
        case "open":
          return (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Conectado
            </Badge>
          );
        case "connecting":
          return (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              Aguardando conexão
            </Badge>
          );
        case "loading":
          return (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Carregando
            </Badge>
          );
        case "error":
          return (
            <Badge variant="destructive">
              Erro
            </Badge>
          );
        default:
          return (
            <Badge variant="outline" className="text-muted-foreground">
              Desconectado
            </Badge>
          );
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <MessageCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Integração WhatsApp</h3>
              <p className="text-sm text-muted-foreground">Conecte o WhatsApp desta unidade</p>
            </div>
          </div>
          {renderStatusBadge()}
        </div>

        {/* Disconnected State */}
        {connectionState === "disconnected" && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
            <Smartphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Conecte seu WhatsApp para receber agendamentos automáticos nesta unidade.
            </p>
            <Button onClick={handleConnect} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Conectar WhatsApp
            </Button>
          </div>
        )}

        {/* Connecting State - Show QR Code */}
        {(connectionState === "connecting" || connectionState === "loading") && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-6">
            {qrCode ? (
              <>
                <div className="mb-4 rounded-lg bg-white p-3">
                  <img
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    className="h-48 w-48"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Escaneie o QR Code com seu WhatsApp
                </p>
                {pairingCode && (
                  <div className="mb-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Ou use o código:</p>
                    <code className="rounded bg-muted px-3 py-1.5 font-mono text-lg font-bold text-foreground">
                      {pairingCode}
                    </code>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshQRCode}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar QR Code
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                {showRetry ? (
                  <>
                    <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Não foi possível gerar o QR Code. Tente novamente.
                    </p>
                    <Button onClick={handleRetry} disabled={isLoading} className="gap-2">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Tentar novamente
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Gerando QR Code...</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshQRCode}
                      disabled={isLoading}
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                      Forçar geração
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Connected State */}
        {connectionState === "open" && (
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
              {/* Profile Picture */}
              {profile?.pictureUrl ? (
                <img 
                  src={profile.pictureUrl} 
                  alt="WhatsApp" 
                  className="h-16 w-16 rounded-full object-cover border-2 border-green-500/50 shadow-md"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50">
                  <MessageCircle className="h-8 w-8 text-green-500" />
                </div>
              )}
              
              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-lg">
                  {profile?.name || 'WhatsApp conectado'}
                </p>
                {profile?.phone && (
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(profile.phone)}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-500 font-medium">Online</span>
                </div>
              </div>
            </div>
            
            {/* Disconnect Button - Full Width */}
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4" />
              )}
              Desconectar WhatsApp
            </Button>
          </div>
        )}
      </div>
    );
  }
);

UnitWhatsAppIntegration.displayName = "UnitWhatsAppIntegration";
