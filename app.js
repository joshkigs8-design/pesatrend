let records = JSON.parse(localStorage.getItem("records")) || [];
let editingIndex = null;
let businessType = localStorage.getItem("businessType") || null;
let currentLang = localStorage.getItem("lang") || "en";
let businessName = localStorage.getItem("businessName") || "";
let businessPhone = localStorage.getItem("businessPhone") || "";
let currentSaleID = Date.now(); // Unique ID per purchase

// Language translations
const translations = {
    en: {dashboard:"PESATREND Dashboard", addRecord:"Add Record", sales:"Sales", expenses:"Expenses", profit:"Profit", cash:"Cash", mpesa:"M-PESA", businessTypeLabel:"Select your business type"},
    sw: {dashboard:"Kipimo cha PESATREND", addRecord:"Ongeza Rekodi", sales:"Mauzo", expenses:"Matumizi", profit:"Faida", cash:"Pesa Taslimu", mpesa:"M-PESA", businessTypeLabel:"Chagua aina ya biashara yako"}
};

function updateLanguage(){
    const t = translations[currentLang];
    document.querySelector("h1").textContent=t.dashboard;
    document.getElementById("addRecordBtn").textContent=t.addRecord;
    document.getElementById("salesCard").textContent=t.sales+": KES 0";
    document.getElementById("expensesCard").textContent=t.expenses+": KES 0";
    document.getElementById("profitCard").textContent=t.profit+": KES 0";
    document.getElementById("cashCard").textContent=t.cash+": KES 0";
    document.getElementById("mpesaCard").textContent=t.mpesa+": KES 0";
    document.getElementById("businessTypeLabel").textContent=t.businessTypeLabel;
}
document.getElementById("languageSelect").value=currentLang;
document.getElementById("languageSelect").onchange=e=>{currentLang=e.target.value; localStorage.setItem("lang",currentLang); updateLanguage();}
updateLanguage();

// Business Info Modal
const businessInfoModal = document.getElementById("businessInfoModal");
const businessForm = document.getElementById("businessInfoForm");
if(!businessName || !businessPhone) businessInfoModal.style.display="flex";
businessForm.onsubmit = e => {
    e.preventDefault();
    businessName = document.getElementById("businessName").value.trim();
    businessPhone = document.getElementById("businessPhone").value.trim();
    localStorage.setItem("businessName", businessName);
    localStorage.setItem("businessPhone", businessPhone);
    businessInfoModal.style.display="none";
};

// Modal close
document.querySelectorAll(".close").forEach(btn=>btn.onclick=()=>btn.parentElement.parentElement.style.display="none");
window.onclick = e => { if(e.target.classList.contains("modal")) e.target.style.display="none"; };

// Business type
if(!businessType) document.getElementById("businessTypeDiv").style.display="block";
else document.getElementById("businessTypeDiv").style.display="none";
document.getElementById("setBusinessTypeBtn").onclick=()=>{
    businessType=document.getElementById("businessType").value;
    localStorage.setItem("businessType",businessType);
    document.getElementById("businessTypeDiv").style.display="none";
};

// Add/Edit Record Modal
const modal=document.getElementById("recordModal");
const modalTitle=document.getElementById("modalTitle");
const form=document.getElementById("recordForm");
document.getElementById("addRecordBtn").onclick=()=>{
    editingIndex=null; modalTitle.textContent="Add Record"; form.reset();
    document.getElementById("recordDate").value = new Date().toISOString().split("T")[0];
    modal.style.display="flex";
};
form.onsubmit=e=>{
    e.preventDefault();
    const record={
        saleID: currentSaleID,
        category: document.getElementById("recordCategory").value,
        product: document.getElementById("recordProduct").value.trim() || "-",
        quantity: parseFloat(document.getElementById("recordQuantity").value) || 0,
        amount: parseFloat(document.getElementById("recordAmount").value) || 0,
        payment: document.getElementById("recordPayment").value,
        date: document.getElementById("recordDate").value,
        description: document.getElementById("recordDesc").value.trim() || "-"
    };
    if(editingIndex !== null) records[editingIndex] = record;
    else records.push(record);
    localStorage.setItem("records", JSON.stringify(records));
    modal.style.display="none";
    renderRecords();
};

// Render Records + Dashboard Totals
function renderRecords(){
    const list=document.getElementById("recordsList"); list.innerHTML="";
    let sales=0, expenses=0, cash=0, mpesa=0;

    records.forEach((r,index)=>{
        const amt = parseFloat(r.amount) || 0;
        const qty = parseFloat(r.quantity) || 0;

        const div=document.createElement("div");
        div.innerHTML=`<span>${r.date} | ${r.category} | ${r.product} | ${qty} | KES ${amt.toFixed(2)} | ${r.payment}</span>`;

        const editBtn=document.createElement("button"); editBtn.textContent="Edit";
        editBtn.onclick=()=>{
            editingIndex=index; modalTitle.textContent="Edit Record";
            document.getElementById("recordCategory").value=r.category;
            document.getElementById("recordProduct").value=r.product;
            document.getElementById("recordQuantity").value=qty;
            document.getElementById("recordAmount").value=amt;
            document.getElementById("recordPayment").value=r.payment;
            document.getElementById("recordDate").value=r.date;
            document.getElementById("recordDesc").value=r.description;
            modal.style.display="flex";
        };

        const deleteBtn=document.createElement("button"); deleteBtn.textContent="Delete";
        deleteBtn.onclick=()=>{
            records.splice(index,1); localStorage.setItem("records",JSON.stringify(records)); renderRecords();
        };

        const receiptBtn=document.createElement("button"); receiptBtn.textContent="Receipt";
        receiptBtn.onclick=()=>generateReceiptBySaleID(r.saleID);

        div.appendChild(editBtn); div.appendChild(deleteBtn); div.appendChild(receiptBtn);
        list.appendChild(div);

        sales += amt;
        if(amt<0) expenses += -amt;
        if(r.payment==="cash") cash += amt;
        if(r.payment==="mpesa") mpesa += amt;
    });

    document.getElementById("salesCard").textContent="Sales: KES "+sales.toFixed(2);
    document.getElementById("expensesCard").textContent="Expenses: KES "+expenses.toFixed(2);
    document.getElementById("profitCard").textContent="Profit: KES "+(sales-expenses).toFixed(2);
    document.getElementById("cashCard").textContent="Cash: KES "+cash.toFixed(2);
    document.getElementById("mpesaCard").textContent="M-PESA: KES "+mpesa.toFixed(2);

    updateChart();
    runAI();
}

// Chart.js
const ctx=document.getElementById("trendChart").getContext("2d");
const chart=new Chart(ctx,{type:"line", data:{labels:[], datasets:[{label:"Profit", data:[], borderColor:"#1976d2", fill:false}]}, options:{responsive:true}});
function updateChart(){ chart.data.labels=records.map(r=>r.date); chart.data.datasets[0].data=records.map(r=>parseFloat(r.amount)||0); chart.update(); }

// AI Insights
function runAI(){
    const aiList=document.getElementById("aiInsights"); aiList.innerHTML="";
    if(records.length===0){ aiList.innerHTML="<li>No records yet.</li>"; return; }
    const profits=records.map(r=>parseFloat(r.amount)||0);
    const avgProfit=profits.reduce((a,b)=>a+b,0)/profits.length;
    const lastDate=new Date(records[records.length-1].date); lastDate.setDate(lastDate.getDate()+1);
    const nextDateStr=lastDate.toISOString().split("T")[0];
    aiList.innerHTML+=`<li>Predicted profit for ${nextDateStr}: KES ${avgProfit.toFixed(2)}</li>`;
    const salesCount={};
    records.forEach(r=>{ const key=r.product.toLowerCase().trim(); salesCount[key]=(salesCount[key]||0)+ (parseFloat(r.quantity)||0); });
    const topProduct=Object.keys(salesCount).reduce((a,b)=>salesCount[a]>salesCount[b]?a:b);
    if(topProduct) aiList.innerHTML+=`<li>Top selling item: ${topProduct}</li>`;
}

// Export Excel
document.getElementById("exportBtn").onclick=()=>{
    const ws=XLSX.utils.json_to_sheet(records);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"PESATREND");
    XLSX.writeFile(wb,"PESATREND.xlsx");
};

// Multi-item receipt
function generateReceiptBySaleID(saleID){
    const items = records.filter(r=>r.saleID===saleID);
    if(items.length===0) return;
    let total=0;
    let tableRows='';
    items.forEach(r=>{
        const qty = parseFloat(r.quantity)||0;
        const amt = parseFloat(r.amount)||0;
        total += amt;
        tableRows += `<tr>
            <td>${r.product}</td>
            <td>${qty}</td>
            <td>KES ${amt.toFixed(2)}</td>
            <td>${r.payment}</td>
        </tr>`;
    });
    const body=document.getElementById("receiptBody");
    body.innerHTML = `
        <h3>${businessName}</h3>
        <p>Phone: ${businessPhone}</p>
        <hr>
        <table>
            <tr><th>Item</th><th>Quantity</th><th>Amount</th><th>Payment</th></tr>
            ${tableRows}
        </table>
        <hr>
        <p>Total: KES ${total.toFixed(2)}</p>
        <p style="text-align:center;">Thank you for your business!</p>
    `;
    document.getElementById("receiptModal").style.display="flex";
    currentSaleID = Date.now(); // new sale for next customer
}

renderRecords();
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('Service Worker registered:', reg))
        .catch(err => console.log('Service Worker failed:', err));
    });
}
