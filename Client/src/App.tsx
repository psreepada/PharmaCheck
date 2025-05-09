import React, { useState } from "react";
import './App.css';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface DrugInfo {
  IUPACName: string;
  MolecularFormula: string;
}

const App: React.FC = () => {
  const genAI = new GoogleGenerativeAI("AIzaSyD4w80Q7GL1TyOB3qIzdtk5IAWrvhIyoVw");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [age, setAge] = useState("");
  const [chemicalInfo1, setChemicalInfo1] = useState<DrugInfo | null>(null);
  const [chemicalInfo2, setChemicalInfo2] = useState<DrugInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [Response, setResponse] = useState<string | null>(null);
  const [showInteraction, setShowInteraction] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);

  async function getAi() {
    const result = await model.generateContent(
      `Find and describe any negative consquences/interactions for taking the following medical drugs together in the human body. The patient is ${age} years old. Discuss the potential side effects, interactions, other negative consequences, extra considerations (time factor is a major one), and other recommendations. Also try to make everything consice and easy to read and understand (no Tables). TALK MORE ABOUT THE CHEMISTRY. Make sure to also discuss the exact chemical reactions that happen in your body detailly. Talk more about the chemistry, while also talking Moderately about the biological reactions in the body. Make it very concise and short. Remember to make it concise: ${drug1} and ${drug2}. The patient is ${gender} and weighs ${weight} pounds and is ${height} inches tall.`
    );
    const response = await result.response;
    const cleanedResponse = response.text?.replace(/\*/g, '') || null;
    setResponse(cleanedResponse);
  }

  const getRxcui = async (drug: string): Promise<string | null> => {
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${drug}`
    );
    const data = await res.json();
    return data.idGroup?.rxnormId?.[0] || null;
  };

  const getChemicalInfo = async (drug: string): Promise<DrugInfo | null> => {
    try {
      const res = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${drug}/property/MolecularFormula,IUPACName/JSON`
      );
      const data = await res.json();
      const props = data.PropertyTable.Properties[0];
      return {
        IUPACName: props.IUPACName,
        MolecularFormula: props.MolecularFormula,
      };
    } catch (err) {
      return null;
    }
  };

  const handleCheck = async () => {
    setError(null);
    setChemicalInfo1(null);
    setChemicalInfo2(null);
    setResponse(null);
    setShowInteraction(false);
    setIsLoading(true);

    try {
      // First verify both drugs are real through RxCUI check
      const rxcui1 = await getRxcui(drug1);
      const rxcui2 = await getRxcui(drug2);

      if (!rxcui1 || !rxcui2) {
        setError("Could not find one or both drugs in the database. Please check the drug names and try again.");
        return;
      }

      // If drugs are real, get chemical info and AI response
      const [info1, info2] = await Promise.all([
        getChemicalInfo(drug1),
        getChemicalInfo(drug2)
      ]);

      setChemicalInfo1(info1);
      setChemicalInfo2(info2);
      await getAi();
      setShowInteraction(true);
    } catch (err) {
      setError("An error occurred while fetching the data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="card">
          <h1 className="title">PharmaCheck</h1>

          <div className="input-container">
            <input
              className="input-field"
              placeholder="Enter first drug (e.g., ibuprofen)"
              value={drug1}
              onChange={(e) => setDrug1(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && drug1 && drug2 && age && handleCheck()}
            />
            {drug1 && <span className="input-icon">💊</span>}
          </div>

          <div className="input-container">
            <input
              className="input-field"
              placeholder="Enter second drug (e.g., acetaminophen)"
              value={drug2}
              onChange={(e) => setDrug2(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && drug1 && drug2 && age && handleCheck()}
            />
            {drug2 && <span className="input-icon">💊</span>}
          </div>

          <div className="input-container">
            <input
              className="input-field"
              type="number"
              placeholder="Enter age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && drug1 && drug2 && age && handleCheck()}
              min="0"
              max="120"
            />
            {age && <span className="input-icon">👤</span>}
          </div>

          <div className="input-container">
            <select
              className="input-field"
              value={gender || ''}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {gender && <span className="input-icon">⚧</span>}
          </div>

          <div className="input-container">
            <input
              className="input-field"
              type="number"
              placeholder="Enter weight (pounds)"
              value={weight || ''}
              onChange={(e) => setWeight(e.target.value)}
              min="0"
              max="1000"
            />
            {weight && <span className="input-icon">⚖️</span>}
          </div>

          <div className="input-container">
            <input
              className="input-field"
              type="number"
              placeholder="Enter height (inches)"
              value={height || ''}
              onChange={(e) => setHeight(e.target.value)}
              min="0"
              max="120"
            />
            {height && <span className="input-icon">📏</span>}
          </div>

          <button
            className={`check-button ${isLoading ? 'disabled' : ''}`}
            onClick={handleCheck}
            disabled={isLoading || !drug1 || !drug2 || !age || !gender || !weight || !height}
          >
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                Analyzing...
              </div>
            ) : (
              'Check Interaction'
            )}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="results-container">
          {chemicalInfo1 && (
            <div className="drug-info-card">
              <h3 className="drug-info-title">{drug1}</h3>
              <div className="info-item">
                <p className="info-label">IUPAC Name</p>
                <p className="info-value">{chemicalInfo1.IUPACName}</p>
              </div>
              <div className="info-item">
                <p className="info-label">Molecular Formula</p>
                <p className="info-value">{chemicalInfo1.MolecularFormula}</p>
              </div>
            </div>
          )}

          {chemicalInfo2 && (
            <div className="drug-info-card">
              <h3 className="drug-info-title">{drug2}</h3>
              <div className="info-item">
                <p className="info-label">IUPAC Name</p>
                <p className="info-value">{chemicalInfo2.IUPACName}</p>
              </div>
              <div className="info-item">
                <p className="info-label">Molecular Formula</p>
                <p className="info-value">{chemicalInfo2.MolecularFormula}</p>
              </div>
            </div>
          )}
        </div>

        {showInteraction && Response && (
          <div className="card interaction-result">
            <h2 className="drug-info-title">Interaction Analysis</h2>
            <div className="info-item">
              <p className="info-value">{Response}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;