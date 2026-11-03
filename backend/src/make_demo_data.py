"""Synthetic stand-in for a CIC-IDS-style CSV so the pipeline runs end to end. Replace data/raw/traffic.csv with your real dataset."""
import numpy as np,pandas as pd
r=np.random.default_rng(0);n=8000;atk=r.random(n)<.25
def col(b,a):return np.where(atk,a,b)
df=pd.DataFrame({
 'Flow Duration':col(r.lognormal(8,1.2,n),r.lognormal(4.5,1,n)).round(),
 'Total Fwd Packets':col(r.poisson(9,n),r.poisson(250,n)),
 'Total Bwd Packets':col(r.poisson(7,n),r.poisson(1,n)),
 'Flow Bytes/s':col(r.lognormal(8.5,1,n),r.lognormal(13,.8,n)).round(1),
 'Flow Packets/s':col(r.lognormal(1.8,.9,n),r.lognormal(7.5,.7,n)).round(2),
 'Destination Port':np.where(atk,r.choice([80,22,443,21],n),r.choice([443,53,80,8080,123],n))})
df['Label']=np.where(atk,r.choice(['DoS','PortScan','DDoS'],n),'BENIGN')
df.to_csv('data/raw/traffic.csv',index=False);print('wrote',len(df),'rows')
