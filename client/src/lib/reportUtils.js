import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
import { notify } from '@/lib/notify'
applyPlugin(jsPDF)

export function exportAnalyticsPDF(type, data, extra = {}) {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(18)
    doc.text(type === 'user' ? 'My Analytics Report' : `Assessment Report: ${extra.title || ''}`, pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, 28, { align: 'center' })

    if (type === 'user' && data) {
      let y = 40
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text('Performance Summary', 14, y)
      y += 8

      doc.autoTable({
        startY: y,
        head: [['Metric', 'Value']],
        body: [
          ['Total Attempts', String(data.totalAttempts ?? 0)],
          ['Completed', String(data.completed ?? 0)],
          ['Passed', String(data.passed ?? 0)],
          ['Pass Rate', `${data.passRate ?? 0}%`],
          ['Average Score', `${data.avgScore ?? 0}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      })

      y = doc.lastAutoTable.finalY + 14

      if (data.scores?.length > 0) {
        doc.setFontSize(14)
        doc.text('Score History', 14, y)
        y += 8

        doc.autoTable({
          startY: y,
          head: [['Date', 'Assessment', 'Score', 'Passed']],
          body: data.scores.map((s) => [
            s.date ? new Date(s.date).toLocaleDateString() : '—',
            s.assessment,
            `${s.score}%`,
            s.passed ? 'Yes' : 'No',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
        })

        y = doc.lastAutoTable.finalY + 14
      }

      if (data.recentActivity?.length > 0) {
        doc.setFontSize(14)
        doc.text('Recent Activity', 14, y)
        y += 8

        doc.autoTable({
          startY: y,
          head: [['Date', 'Assessment', 'Score', 'Result']],
          body: data.recentActivity.map((a) => [
            a.date ? new Date(a.date).toLocaleDateString() : '—',
            a.title,
            `${a.score}%`,
            a.passed ? 'Passed' : 'Failed',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
        })
      }
    }

    if (type === 'assessment' && data) {
      let y = 40
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text('Assessment Summary', 14, y)
      y += 8

      doc.autoTable({
        startY: y,
        head: [['Metric', 'Value']],
        body: [
          ['Total Attempts', String(data.totalAttempts ?? 0)],
          ['Passed', String(data.passed ?? 0)],
          ['Pass Rate', `${data.passRate ?? 0}%`],
          ['Average Score', `${data.avgScore ?? 0}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      })

      y = doc.lastAutoTable.finalY + 14

      if (data.questionStats?.length > 0) {
        doc.setFontSize(14)
        doc.text('Question Statistics', 14, y)
        y += 8

        doc.autoTable({
          startY: y,
          head: [['Question', 'Type', 'Correct', 'Incorrect', 'Skipped', 'Correct %']],
          body: data.questionStats.map((qs) => [
            qs.title,
            qs.type,
            String(qs.correct),
            String(qs.incorrect),
            String(qs.skipped),
            `${qs.correctPercentage}%`,
          ]),
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          columnStyles: { 0: { cellWidth: 50 } },
        })
      }

      if (data.scoreDistribution?.length > 0) {
        y = doc.lastAutoTable.finalY + 14
        doc.setFontSize(14)
        doc.text('Score Distribution', 14, y)
        y += 8

        doc.autoTable({
          startY: y,
          head: [['Range', 'Count']],
          body: data.scoreDistribution.map((s) => [s.range, String(s.count)]),
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
        })
      }
    }

    doc.save(`${type}-report-${Date.now()}.pdf`)
    notify.success('PDF exported successfully')
  } catch (err) {
    console.error('PDF export failed:', err)
    notify.error('Failed to generate PDF. Please try again.')
  }
}
