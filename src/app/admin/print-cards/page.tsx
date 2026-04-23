'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer, RefreshCw, TreePine } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PrintItem } from '@/app/api/print-items/route'

const ADMIN_PIN_KEY = 'scout-bingo-admin-pin'

const CATEGORY_LABELS: Record<string, string> = {
  'trees-plants': 'Trees & Plants',
  'animals-insects': 'Animals & Insects',
  'landscape-features': 'Landscape',
  'activities-challenges': 'Activities',
  'scavenger-finds': 'Scavenger Finds',
  observation: 'Observation',
  templates: 'Colour / Texture',
}

const CATEGORY_SHAPES: Record<string, string> = {
  'trees-plants':
    '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#333" stroke-width="1.5"/></svg>',
  'animals-insects':
    '<svg viewBox="0 0 16 16"><polygon points="8,1 15,15 1,15" fill="none" stroke="#333" stroke-width="1.5"/></svg>',
  'landscape-features':
    '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="none" stroke="#333" stroke-width="1.5"/></svg>',
  'activities-challenges':
    '<svg viewBox="0 0 16 16"><polygon points="8,1 10.5,6 16,6.5 12,10.5 13,16 8,13 3,16 4,10.5 0,6.5 5.5,6" fill="none" stroke="#333" stroke-width="1.5"/></svg>',
  'scavenger-finds':
    '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="0" ry="0" transform="rotate(45 8 8)" fill="none" stroke="#333" stroke-width="1.5"/></svg>',
  observation:
    '<svg viewBox="0 0 16 16"><polygon points="8,1 11,6 16,8 11,10 8,15 5,10 0,8 5,6" fill="none" stroke="#333" stroke-width="1.5"/></svg>',
  templates:
    '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#333" stroke-width="1.5" stroke-dasharray="3,2"/></svg>',
}

const GRID_SIZE = 25

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function generateCards(items: PrintItem[], count: number): PrintItem[][] {
  const cards: PrintItem[][] = []
  for (let i = 0; i < count; i++) {
    cards.push(shuffle(items).slice(0, GRID_SIZE))
  }
  return cards
}

function PrintCardsPage() {
  const [items, setItems] = useState<PrintItem[]>([])
  const [cards, setCards] = useState<PrintItem[][]>([])
  const [cardCount, setCardCount] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchItems() {
      const pin = localStorage.getItem(ADMIN_PIN_KEY) ?? ''
      if (!pin) {
        setError('Not authenticated. Please log in via the admin page first.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/print-items', {
          headers: { 'X-Admin-Pin': pin },
        })
        if (!res.ok) {
          setError('Failed to load items. Check your admin PIN.')
          setLoading(false)
          return
        }
        const data = (await res.json()) as { items: PrintItem[] }
        setItems(data.items)
        setCards(generateCards(data.items, cardCount))
      } catch {
        setError('Failed to load items.')
      } finally {
        setLoading(false)
      }
    }

    void fetchItems()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRegenerate() {
    setCards(generateCards(items, cardCount))
    toast.success(`Generated ${cardCount} new cards`)
  }

  function handleCountChange(value: string) {
    const num = Math.max(1, Math.min(100, parseInt(value, 10) || 1))
    setCardCount(num)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground mt-2">Loading items...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 size-4" />
                Back to Admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Screen-only controls */}
      <div className="bg-card border-border fixed top-0 right-0 left-0 z-50 border-b px-4 py-3 shadow-sm print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-4" />
              Admin
            </Button>
          </Link>

          <div className="bg-border h-6 w-px" />

          <div className="flex items-center gap-2">
            <TreePine className="text-muted-foreground size-5" />
            <h1 className="text-lg font-bold">Print Bingo Cards</h1>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Label htmlFor="card-count" className="text-sm whitespace-nowrap">
              Cards:
            </Label>
            <Input
              id="card-count"
              type="number"
              min={1}
              max={100}
              value={cardCount}
              onChange={(e) => handleCountChange(e.target.value)}
              className="h-8 w-20 text-center"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleRegenerate}>
            <RefreshCw className="mr-1 size-4" />
            Regenerate
          </Button>

          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 size-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Info bar */}
      <div className="mt-14 border-b px-4 py-2 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <p className="text-muted-foreground text-sm">
            {items.length} items in pool &middot; {cards.length} unique
            5&times;5 cards &middot; A4 landscape, one per page
          </p>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-3">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div
                key={key}
                className="text-muted-foreground flex items-center gap-1 text-xs"
              >
                <span
                  className="inline-block size-3"
                  dangerouslySetInnerHTML={{
                    __html: CATEGORY_SHAPES[key] ?? '',
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printable cards */}
      <div className="mt-4 flex flex-col items-center print:mt-0">
        {cards.map((card, cardIndex) => (
          <div key={cardIndex} className="bingo-card">
            <div className="bingo-card-header">
              <div>
                <div className="bingo-card-title">Scout Nature Bingo</div>
                <div className="bingo-card-subtitle">
                  Find each item and tick the box!
                </div>
              </div>
              <div className="bingo-card-number">Card #{cardIndex + 1}</div>
            </div>
            <div className="bingo-team-line">
              Team: <span className="bingo-team-blank">&nbsp;</span>
            </div>
            <div className="bingo-grid">
              {card.map((item, cellIndex) => (
                <div key={cellIndex} className="bingo-cell">
                  <div className="bingo-check-box" />
                  <div
                    className="bingo-category-shape"
                    dangerouslySetInnerHTML={{
                      __html: CATEGORY_SHAPES[item.category] ?? '',
                    }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
            <div className="bingo-legend">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <div key={key} className="bingo-legend-item">
                  <div
                    className="bingo-legend-shape"
                    dangerouslySetInnerHTML={{
                      __html: CATEGORY_SHAPES[key] ?? '',
                    }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        .bingo-card {
          width: 277mm;
          height: 190mm;
          break-inside: avoid;
          display: flex;
          flex-direction: column;
          padding: 5mm;
          background: white;
          overflow: hidden;
        }

        .bingo-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2mm;
        }

        .bingo-card-title {
          font-size: 18pt;
          font-weight: 800;
          color: #222;
          letter-spacing: -0.5px;
        }

        .bingo-card-subtitle {
          font-size: 9pt;
          color: #666;
        }

        .bingo-card-number {
          font-size: 9pt;
          color: #999;
          font-weight: 600;
        }

        .bingo-team-line {
          font-size: 10pt;
          margin-bottom: 2mm;
          color: #333;
        }

        .bingo-team-blank {
          display: inline-block;
          border-bottom: 1px solid #999;
          width: 60mm;
          margin-left: 2mm;
        }

        .bingo-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-template-rows: repeat(5, 1fr);
          gap: 0;
          flex: 1;
          border: 2.5px solid #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .bingo-cell {
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3mm;
          font-size: 11pt;
          font-weight: 500;
          line-height: 1.25;
          position: relative;
          background: white;
        }

        .bingo-check-box {
          position: absolute;
          top: 2mm;
          right: 2mm;
          width: 5mm;
          height: 5mm;
          border: 1.5px solid #aaa;
          border-radius: 1px;
        }

        .bingo-category-shape {
          position: absolute;
          bottom: 1.5mm;
          left: 1.5mm;
          width: 4mm;
          height: 4mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bingo-category-shape svg {
          width: 100%;
          height: 100%;
        }

        .bingo-legend {
          display: flex;
          gap: 5mm;
          margin-top: 2mm;
          flex-wrap: wrap;
        }

        .bingo-legend-item {
          display: flex;
          align-items: center;
          gap: 1.5mm;
          font-size: 7.5pt;
          color: #666;
        }

        .bingo-legend-shape {
          width: 4mm;
          height: 4mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bingo-legend-shape svg {
          width: 100%;
          height: 100%;
        }

        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </>
  )
}

export default PrintCardsPage
