import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Beaker,
  Database,
  Activity,
  FileJson,
  Search,
  Loader2
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

// Types mimicking the Pydantic schema
interface TableData {
  table_index: number;
  caption: string;
  headers: string[];
  rows: string[][];
}

interface MathEquation {
  equation_latex: string;
  context: string;
}

interface PhysicsResult {
  paper_title: string;
  experiment_type: string;
  key_findings: string[];
  error_margins: string | null;
  tables: TableData[];
  key_equations: MathEquation[];
  confidence_score: number;
  failure_reasons: string[];
  source_file: string;
}

interface FailureReport {
  source_file: string;
  confidence_score: number;
  reasons: string[];
}

function App() {
  const [activeTab, setActiveTab] = useState<'success' | 'failures'>('success');
  const [results, setResults] = useState<PhysicsResult[]>([]);
  const [failures, setFailures] = useState<FailureReport[]>([]);
  
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    setFailures([]);

    try {
      const response = await fetch('http://localhost:8000/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to process pipeline');
      }

      setResults(data.data || []);
      setFailures(data.failures || []);
      
      // Auto-switch tabs if there are failures but no successes
      if ((data.data || []).length === 0 && (data.failures || []).length > 0) {
        setActiveTab('failures');
      } else {
        setActiveTab('success');
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-optonet-500 selection:text-white pb-20">
      
      {/* Header Pipeline Status */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-optonet-500 p-2 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-optonet-900 to-optonet-500">
                  OptoNet State Space Pipeline
                </h1>
                <p className="text-xs text-slate-500 font-medium">Unstructured Data Pipeline</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <form onSubmit={runPipeline} className="flex relative">
                <input
                  type="text"
                  placeholder="https://arxiv.org/abs/... "
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-slate-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-optonet-500"
                  disabled={isLoading}
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="submit"
                  disabled={!url || isLoading}
                  className="bg-optonet-600 hover:bg-optonet-700 text-white px-4 py-2 rounded-r-lg text-sm font-medium transition-colors disabled:opacity-75 flex items-center gap-2 relative"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white/50" /> 
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Extract PDF"
                  )}
                </button>
              </form>
              
              <div className="flex items-center space-x-2 text-sm ml-4">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLoading ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isLoading ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
                <span className="font-medium text-slate-700 w-24">
                  {isLoading ? 'Processing' : 'System Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl mb-8 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Documents Processed</p>
                {isLoading ? (
                  <div className="h-9 w-12 bg-slate-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{results.length + failures.length}</h3>
                )}
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Successful Extractions</p>
                {isLoading ? (
                  <div className="h-9 w-12 bg-slate-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{results.length}</h3>
                )}
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingestion Failures</p>
                {isLoading ? (
                  <div className="h-9 w-12 bg-slate-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{failures.length}</h3>
                )}
              </div>
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-200/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('success')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'success' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Structured Extractions
          </button>
          <button 
            onClick={() => setActiveTab('failures')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'failures' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Failure Logs (Transparency)
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 text-optonet-500 mb-6 animate-spin" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Processing ArXiv Paper</h2>
            <p className="text-slate-500 text-center max-w-sm text-sm">
              The pipeline is fetching the PDF, extracting vector data via Docling, and processing findings with the LLM schema. 
              <br/><br/>
              This takes roughly <strong>1-2 minutes</strong> depending on the density of the paper.
            </p>
          </div>
        ) : activeTab === 'success' ? (
          <div className="space-y-8">
            {results.map((result, idx) => (
              <div key={idx} className="glass-panel overflow-hidden border border-emerald-100">
                <div className="bg-gradient-to-r from-emerald-50 to-white p-6 border-b border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-medium text-emerald-600 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>High Confidence Extraction ({Math.round(result.confidence_score * 100)}%)</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">{result.paper_title}</h2>
                      <p className="text-slate-500 mt-1 font-mono text-sm">{result.source_file}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Metadata & Findings */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Experiment Context
                      </h4>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-sm text-slate-700 font-medium">{result.experiment_type}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Beaker className="h-4 w-4" /> Key Findings
                      </h4>
                      <ul className="space-y-2">
                        {result.key_findings.map((finding, i) => (
                          <li key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <span className="h-6 w-6 rounded-full bg-optonet-50 text-optonet-500 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                            <span className="text-sm text-slate-700">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {result.error_margins && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Error Margins
                        </h4>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-amber-800 text-sm">
                          {result.error_margins}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Tables & Math */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" /> Extracted Tables
                      </h4>
                      {result.tables.map((table, tIdx) => (
                        <div key={tIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <p className="text-xs font-medium text-slate-500">Table {table.table_index}</p>
                            <p className="text-sm font-bold text-slate-800">{table.caption}</p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-slate-50">
                                <tr>
                                  {table.headers.map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-200">
                                {table.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-slate-50">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>

                    {result.key_equations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <FileJson className="h-4 w-4" /> Key Equations
                        </h4>
                        {result.key_equations.map((eq, eIdx) => (
                          <div key={eIdx} className="bg-white rounded-xl p-6 shadow-sm mb-3 border border-slate-200">
                            <div className="overflow-x-auto my-2">
                              <BlockMath 
                                math={eq.equation_latex.replace(/^\$+|\$+$/g, '')} 
                                renderError={(error) => {
                                  return (
                                    <div className="text-rose-500 text-sm font-mono bg-rose-50 p-3 rounded border border-rose-100">
                                      LaTeX Render Error: {error.name}
                                      <br/>
                                      <span className="text-slate-500 text-xs mt-2 block w-full whitespace-pre-wrap">Raw text: {eq.equation_latex}</span>
                                    </div>
                                  );
                                }}
                              />
                            </div>
                            <p className="text-slate-500 text-sm font-medium border-t border-slate-100 pt-3 mt-3">{eq.context}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5" /> Pipeline Transparency
              </h3>
              <p className="text-rose-700 text-sm">
                OptoNet values knowing the limits of our systems. The following inputs failed during the pipeline process and were automatically caught and isolated without hallucinating data.
              </p>
            </div>

            {failures.map((fail, idx) => (
              <div key={idx} className="glass-panel overflow-hidden border-rose-100 flex flex-col md:flex-row shadow-sm">
                <div className="bg-slate-50 p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
                  <div className="flex items-center space-x-2 text-rose-500 mb-2">
                    <XCircle className="h-5 w-5" />
                    <span className="font-bold text-sm">Ingestion Failed</span>
                  </div>
                  <p className="text-sm font-mono text-slate-600 break-words">{fail.source_file}</p>
                </div>
                <div className="p-6 md:w-2/3 bg-white">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Failure Reason</h4>
                  <ul className="space-y-2">
                    {fail.reasons.map((reason, i) => (
                      <li key={i} className="text-sm text-slate-700 bg-rose-50 p-3 rounded-lg border border-rose-100 inline-block w-full">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
