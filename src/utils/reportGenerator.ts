import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SurveyWithRelations } from '../types/database';
import { formatChartData, type ChartData } from './surveyVisualization';

export const generateReport = async (survey: SurveyWithRelations): Promise<string> => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(`Survey Report: ${survey.title}`, 14, 20);

  // Add survey details
  doc.setFontSize(12);
  doc.text(`Client: ${survey.clients?.name || 'N/A'}`, 14, 30);
  doc.text(`Created: ${new Date(survey.created_at).toLocaleDateString()}`, 14, 38);
  doc.text(`Status: ${survey.status}`, 14, 46);

  // Add responses summary
  const responses = survey.survey_responses || [];
  const completed = responses.filter(r => r.status === 'completed').length;
  const avgSuccessRate = responses.length > 0
    ? responses.reduce((acc, r) => acc + (r.success_rate || 0), 0) / responses.length
    : 0;

  autoTable(doc, {
    startY: 60,
    head: [['Total Responses', 'Completed', 'Average Success Rate']],
    body: [[responses.length, completed, `${(avgSuccessRate * 100).toFixed(1)}%`]],
  });

  // Add chart data
  const chartData = formatChartData(survey);
  let yOffset = 90;

  chartData.forEach((chart: ChartData) => {
    doc.setFontSize(14);
    doc.text(chart.title, 14, yOffset);
    yOffset += 10;

    autoTable(doc, {
      startY: yOffset,
      head: [chart.headers],
      body: chart.data,
    });

    yOffset = doc.lastAutoTable.finalY + 10;
  });

  // Save the PDF and return as a data URL
  return doc.output('datauristring');
};