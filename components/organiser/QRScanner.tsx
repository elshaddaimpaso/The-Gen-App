// components/organiser/QRScanner.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { Camera, X, CheckCircle, AlertTriangle, Clock, CameraOff } from 'lucide-react'
import QrScanner from 'qr-scanner'

export function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{
    participant: any
    success: boolean
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentCheckins, setRecentCheckins] = useState<any[]>([])
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    fetchRecentCheckins()
    const interval = setInterval(fetchRecentCheckins, 10000)

    return () => {
      isMounted.current = false
      clearInterval(interval)
      stopScanner()
    }
  }, [])

  const fetchRecentCheckins = async () => {
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*, participants(full_name, groups(name))')
        .order('scanned_at', { ascending: false })
        .limit(10)
      if (data && isMounted.current) setRecentCheckins(data)
    } catch (error) {
      console.error('Error fetching recent checkins:', error)
    }
  }

  const startScanner = async () => {
    if (!isMounted.current) return
    if (!videoRef.current) {
      toast.error('Video element not found')
      return
    }

    try {
      // Clean up existing scanner
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result && result.data) {
            onScanSuccess(result.data)
          }
        },
        {
          onDecodeError: () => {},
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      scannerRef.current = scanner
      await scanner.start()
      
      if (isMounted.current) {
        setScanning(true)
        setCameraReady(true)
        toast.success('Scanner ready! Point at a QR code.')
      }
    } catch (error: any) {
      console.error('Scanner error:', error)
      if (isMounted.current) {
        if (error?.name === 'NotAllowedError') {
          toast.error('Camera permission denied. Please allow camera access.')
        } else if (error?.name === 'NotFoundError') {
          toast.error('No camera found on this device.')
        } else {
          toast.error('Failed to start camera. Please try again.')
        }
      }
    }
  }

  const stopScanner = () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      }
    } catch (error) {
      console.error('Error stopping scanner:', error)
    }
    if (isMounted.current) {
      setScanning(false)
      setCameraReady(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanning immediately
    stopScanner()
    if (isMounted.current) {
      await processCheckIn(decodedText)
    }
  }

  const processCheckIn = async (participantId: string) => {
    if (!isMounted.current) return

    setLoading(true)
    try {
      const { data: participant, error } = await supabase
        .from('participants')
        .select('*, groups(*), transport(*)')
        .eq('id', participantId)
        .single()

      if (error || !participant) {
        setScanResult({
          participant: null,
          success: false,
          message: '❌ Participant not found'
        })
        toast.error('Participant not found')
        return
      }

      if (participant.checked_in) {
        setScanResult({
          participant,
          success: false,
          message: `⚠️ ${participant.full_name} already checked in`
        })
        toast.error(`${participant.full_name} already checked in`)
        return
      }

      const { error: updateError } = await supabase
        .from('participants')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('id', participant.id)

      if (updateError) throw updateError

      await supabase.from('attendance').insert({
        participant_id: participant.id,
        scanned_at: new Date().toISOString()
      })

      setScanResult({
        participant,
        success: true,
        message: `✅ ${participant.full_name} checked in!`
      })

      toast.success(`✅ ${participant.full_name} checked in!`)
      await fetchRecentCheckins()
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('Failed to check in')
      setScanResult({
        participant: null,
        success: false,
        message: '❌ Check-in failed. Please try again.'
      })
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard dark>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Camera size={20} className="text-[#D4AF37]" />
            QR Scanner
          </h3>
          <div className="flex gap-2">
            {!scanning ? (
              <GoldButton onClick={startScanner} className="text-sm px-4 py-2">
                <Camera size={16} />
                Start Scanner
              </GoldButton>
            ) : (
              <button
                onClick={stopScanner}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <CameraOff size={16} />
                Stop
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full overflow-hidden rounded-xl bg-[#1A1A1A] min-h-[300px]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
              <Camera size={48} className="mb-3" />
              <p className="text-sm">Click "Start Scanner" to scan QR codes</p>
              <p className="text-xs mt-1 text-white/20">Position QR code in frame</p>
            </div>
          )}
          {scanning && !cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
            </div>
          )}
        </div>

        {scanning && cameraReady && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Scanner active - scanning for QR codes
          </div>
        )}
      </GlassCard>

      {scanResult && (
        <GlassCard
          dark
          className={scanResult.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}
        >
          <div className="flex items-start gap-3">
            {scanResult.success ? (
              <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
            ) : (
              <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <p className={`font-semibold ${scanResult.success ? 'text-green-500' : 'text-red-500'}`}>
                {scanResult.message}
              </p>
              {scanResult.participant && (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-white font-medium">{scanResult.participant.full_name}</p>
                  {scanResult.participant.groups && (
                    <p className="text-white/60">Group: {scanResult.participant.groups.name}</p>
                  )}
                  {scanResult.participant.transport && (
                    <p className="text-white/60">Bus: {scanResult.participant.transport.bus_number}</p>
                  )}
                  <p className="text-white/40 text-xs">{new Date().toLocaleTimeString()}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="text-white/30 hover:text-white/60 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard dark>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Clock size={16} className="text-[#D4AF37]" />
          Recent Check-ins
        </h4>
        {recentCheckins.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No check-ins yet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentCheckins.map((checkin) => (
              <div key={checkin.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <div>
                  <p className="text-white text-sm font-medium">
                    {checkin.participants?.full_name || 'Unknown'}
                  </p>
                  {checkin.participants?.groups && (
                    <p className="text-white/40 text-xs">Group: {checkin.participants.groups.name}</p>
                  )}
                </div>
                <span className="text-white/30 text-xs">
                  {new Date(checkin.scanned_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}